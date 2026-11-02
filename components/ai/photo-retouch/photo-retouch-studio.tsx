"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Upload, Wand2, Download, RotateCcw, Eye, ImagePlus, ScanFace, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";
import { detectImageFormat, type DetectedFormat } from "@/lib/ai/retouch/formats";
import {
  ACCEPTED_EXTENSIONS,
  DEFAULT_MAX_UPLOAD_MB,
  DEFAULT_PRESET,
  RETOUCH_PRESETS,
  fileExtension,
  type ExportFormat,
  type RetouchSettings,
} from "@/lib/ai/retouch/settings";
import { BeforeAfter } from "@/components/ai/photo-retouch/before-after";
import { PresetSwitch, RetouchControls, Slider, presetOf } from "@/components/ai/photo-retouch/retouch-controls";
import {
  RetouchRequestError,
  discardJob,
  exportImage,
  processPreview,
  triggerDownload,
  uploadOriginal,
  type Job,
  type PreviewPayload,
  type Stage,
} from "@/components/ai/photo-retouch/retouch-client";

const ACCEPT = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",") + ",image/*";
const BROWSER_DISPLAYABLE = new Set(["jpeg", "png", "webp", "gif", "avif", "bmp"]);

const STAGE_LABEL: Record<Stage, string> = {
  upload: "Import sécurisé de la photo",
  decode: "Vérification et décodage du fichier",
  detect: "Détection du visage",
  retouch: "Retouche de la peau",
  encode: "Préparation de l'aperçu",
};
const STAGE_ORDER: Stage[] = ["upload", "decode", "detect", "retouch", "encode"];

type Phase = "idle" | "uploading" | "uploaded" | "processing" | "ready";

interface ErrorState {
  message: string;
  code?: string;
  retry?: () => void;
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

function sameSettings(a: RetouchSettings, b: RetouchSettings) {
  return (Object.keys(a) as (keyof RetouchSettings)[]).every((k) => k === "intensity" || a[k] === b[k]);
}

export function PhotoRetouchStudio({ toolSwitcher }: { toolSwitcher?: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<DetectedFormat | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [uploadRatio, setUploadRatio] = useState(0);
  const [settings, setSettings] = useState<RetouchSettings>(RETOUCH_PRESETS[DEFAULT_PRESET]);
  const [applied, setApplied] = useState<RetouchSettings | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [exportFormat, setExportFormat] = useState<ExportFormat>("jpeg");
  const [exportQuality, setExportQuality] = useState(92);
  const [exportResolution, setExportResolution] = useState<"original" | number>("original");
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const jobRef = useRef<Job | null>(null);
  jobRef.current = job;

  // Clean up stored files and object URLs when leaving the page.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      discardJob(jobRef.current);
    };
  }, []);
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const preset = presetOf(settings);
  const busy = phase === "uploading" || phase === "processing";
  const dirty = Boolean(preview && applied && !sameSettings(settings, applied));

  const resetAll = useCallback(() => {
    abortRef.current?.abort();
    discardJob(jobRef.current);
    setJob(null);
    setFile(null);
    setFormat(null);
    setLocalPreview(null);
    setPreview(null);
    setApplied(null);
    setError(null);
    setLastExport(null);
    setShowOriginal(false);
    setPhase("idle");
    setSettings(RETOUCH_PRESETS[DEFAULT_PRESET]);
    setExportResolution("original");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const runProcess = useCallback(async (targetJob: Job, next: RetouchSettings) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setPhase("processing");
    setStage("decode");
    try {
      const result = await processPreview(targetJob, next, setStage, controller.signal);
      setPreview(result);
      setApplied(next);
      setShowOriginal(false);
      setPhase("ready");
    } catch (err) {
      if (controller.signal.aborted) return;
      const e = err instanceof RetouchRequestError ? err : new RetouchRequestError("Impossible de contacter le serveur.", 0);
      setPhase(preview ? "ready" : "uploaded");
      setError({
        message: e.message,
        code: e.code,
        retry: e.code === "no-face" || e.code === "quota" ? undefined : () => void runProcess(targetJob, next),
      });
    }
  }, [preview]);

  const startUpload = useCallback(async (selected: File) => {
    setError(null);
    setPhase("uploading");
    setStage("upload");
    setUploadRatio(0);
    try {
      const uploaded = await uploadOriginal(selected, setUploadRatio);
      setJob(uploaded);
      setPhase("uploaded");
      return uploaded;
    } catch (err) {
      const e = err instanceof RetouchRequestError ? err : new RetouchRequestError("Impossible de contacter le serveur.", 0);
      setPhase("idle");
      setError({ message: e.message, retry: () => void startUpload(selected) });
      return null;
    }
  }, []);

  const handleFile = useCallback(
    async (selected: File | undefined) => {
      if (!selected) return;
      resetAll();
      const ext = fileExtension(selected.name);
      if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
        setError({ message: `Extension .${ext || "?"} non prise en charge.` });
        return;
      }
      if (selected.size > DEFAULT_MAX_UPLOAD_MB * 1024 * 1024) {
        setError({ message: `Fichier trop volumineux (${DEFAULT_MAX_UPLOAD_MB} Mo maximum).` });
        return;
      }
      const head = new Uint8Array(await selected.slice(0, 64).arrayBuffer());
      const detected = detectImageFormat(head, ext);
      if (!detected) {
        setError({ message: "Ce fichier n'est pas une image reconnue (le contenu ne correspond à aucun format photo)." });
        return;
      }
      setFile(selected);
      setFormat(detected);
      if (BROWSER_DISPLAYABLE.has(detected.format)) setLocalPreview(URL.createObjectURL(selected));
      await startUpload(selected);
    },
    [resetAll, startUpload]
  );

  async function ensureJob(): Promise<Job | null> {
    if (job) return job;
    if (!file) return null;
    return startUpload(file);
  }

  async function autoRetouch() {
    const auto = { ...RETOUCH_PRESETS[DEFAULT_PRESET] };
    setSettings(auto);
    const j = await ensureJob();
    if (j) await runProcess(j, auto);
  }

  async function applySettings(next = settings) {
    const j = await ensureJob();
    if (j) await runProcess(j, next);
  }

  async function selectPreset(p: keyof typeof RETOUCH_PRESETS) {
    const next = { ...RETOUCH_PRESETS[p] };
    setSettings(next);
    if (preview) await applySettings(next);
  }

  async function handleExport() {
    if (!job || !applied || !preview) return;
    setExporting(true);
    setError(null);
    try {
      const result = await exportImage(
        job,
        { ...applied, intensity: settings.intensity },
        { format: exportFormat, quality: exportQuality, resolution: exportResolution }
      );
      triggerDownload(result.url, result.fileName);
      if (result.revoke) setTimeout(result.revoke, 60_000);
      setLastExport(`${result.fileName} · ${result.width}×${result.height} · ${formatBytes(result.bytes)}`);
      notifySuccess("Photo exportée !");
    } catch (err) {
      const e = err instanceof RetouchRequestError ? err : new RetouchRequestError("Impossible de contacter le serveur.", 0);
      setError({ message: e.message, retry: () => void handleExport() });
    } finally {
      setExporting(false);
    }
  }

  const resolutionOptions = useMemo(() => {
    if (!preview) return [];
    const longEdge = Math.max(preview.analysis.sourceWidth, preview.analysis.sourceHeight);
    return [4096, 2048, 1080].filter((v) => v < longEdge);
  }, [preview]);

  const progressIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-6 dark:bg-zinc-950 sm:py-8 lg:-m-6 lg:px-8">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      <div className="mx-auto grid w-full max-w-6xl gap-4 sm:gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        {/* Controls */}
        <div className="order-2 flex min-w-0 flex-col gap-5 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 lg:order-1">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Retouchez votre photo</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Retouche naturelle de la peau qui préserve l&apos;identité, la texture et les vêtements.
            </p>
          </div>

          {toolSwitcher}

          {file && (
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <ImagePlus className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-zinc-500">
                  {format?.label} · {formatBytes(file.size)}
                  {preview && ` · ${preview.analysis.sourceWidth}×${preview.analysis.sourceHeight}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="shrink-0 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-white"
              >
                Changer
              </button>
            </div>
          )}

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition-all hover:brightness-110 dark:bg-white dark:text-zinc-900"
            >
              <Upload className="h-4 w-4" />
              Importer une photo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void autoRetouch()}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Retoucher automatiquement
            </button>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">Niveau</span>
            <PresetSwitch value={preset} onSelect={(p) => void selectPreset(p)} disabled={busy} />
            {preset === "custom" && <span className="text-[11px] text-zinc-400">Réglages personnalisés</span>}
          </div>

          <details className="group rounded-2xl border border-zinc-200 dark:border-zinc-800" open>
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-zinc-700 marker:hidden dark:text-zinc-300">
              <span className="flex items-center justify-between">
                Réglages personnalisés
                <span className="text-zinc-400 transition-transform group-open:rotate-180">⌄</span>
              </span>
            </summary>
            <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
              <RetouchControls settings={settings} onChange={setSettings} disabled={busy} />
            </div>
          </details>

          {dirty && (
            <button
              type="button"
              onClick={() => void applySettings()}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            >
              <Wand2 className="h-4 w-4" />
              Appliquer les réglages
            </button>
          )}
          {file && !preview && !busy && !error && (
            <button
              type="button"
              onClick={() => void applySettings()}
              className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-white"
            >
              Appliquer ces réglages personnalisés
            </button>
          )}

          <Slider
            label="Intensité générale de la retouche"
            value={settings.intensity}
            onChange={(v) => setSettings((s) => ({ ...s, intensity: v }))}
            hint="Ajustement instantané entre l'original (0) et la retouche complète (100)."
          />

          {error && (
            <div className="flex flex-col gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
              <p className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error.message}</span>
              </p>
              <div className="flex flex-wrap gap-3 pl-6 text-xs font-medium">
                {error.retry && (
                  <button type="button" onClick={error.retry} className="underline underline-offset-2">
                    Réessayer
                  </button>
                )}
                {error.code === "quota" && (
                  <Link href="/premium" className="underline underline-offset-2">
                    Passer à RYNVA Pro
                  </Link>
                )}
                {file && <span className="font-normal opacity-80">Votre photo originale est conservée.</span>}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="order-1 flex min-h-[340px] min-w-0 flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 lg:order-2 lg:min-h-[600px]">
          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void handleFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center transition-colors",
                dragOver
                  ? "border-zinc-500 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-800/50"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
              )}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white">
                <ScanFace className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Cliquez ou déposez une photo</p>
              <p className="max-w-sm text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
                JPEG, PNG, WebP, HEIC/HEIF, TIFF, BMP, GIF, AVIF et RAW (CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2…) ·{" "}
                {DEFAULT_MAX_UPLOAD_MB} Mo max
              </p>
            </button>
          ) : (
            <div className="relative flex flex-1 flex-col items-center justify-center">
              {preview ? (
                <BeforeAfter
                  original={preview.original}
                  retouched={preview.retouched}
                  width={preview.analysis.width}
                  height={preview.analysis.height}
                  intensity={settings.intensity / 100}
                  showOriginal={showOriginal}
                />
              ) : localPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={localPreview} alt="Aperçu de la photo importée" className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-zinc-400">
                  <ImagePlus className="h-8 w-8" />
                  <p className="text-sm">
                    {format?.label} : l&apos;aperçu s&apos;affichera après l&apos;analyse (format non affichable directement par le
                    navigateur).
                  </p>
                </div>
              )}

              {busy && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm dark:bg-zinc-900/70">
                  <div className="flex w-full max-w-xs flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white" aria-live="polite">
                      {STAGE_LABEL[stage]}
                      {stage === "upload" && ` · ${Math.round(uploadRatio * 100)} %`}
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all duration-500 dark:bg-white"
                        style={{
                          width: `${stage === "upload" ? uploadRatio * 20 : 20 + ((progressIndex - 0.5) / (STAGE_ORDER.length - 1)) * 80}%`,
                        }}
                      />
                    </div>
                    <ol className="flex flex-col gap-1 text-xs text-zinc-500">
                      {STAGE_ORDER.map((s, i) => (
                        <li key={s} className={cn("flex items-center gap-2", i > progressIndex && "opacity-40")}>
                          {i < progressIndex ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <span className={cn("h-1.5 w-1.5 rounded-full", i === progressIndex ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300")} />
                          )}
                          {STAGE_LABEL[s]}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {preview && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {preview.analysis.facesRetouched} visage{preview.analysis.facesRetouched > 1 ? "s" : ""} retouché
                  {preview.analysis.facesRetouched > 1 ? "s" : ""}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {preview.analysis.blemishesCorrected} imperfection{preview.analysis.blemishesCorrected > 1 ? "s" : ""} corrigée
                  {preview.analysis.blemishesCorrected > 1 ? "s" : ""}
                </span>
                {applied?.photoCorrections ? (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    Corrections photo appliquées à toute l&apos;image
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    Vêtements et arrière-plan intacts
                  </span>
                )}
              </div>
              {preview.analysis.notes.length > 0 && (
                <ul className="flex flex-col gap-1 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                  {preview.analysis.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onPointerDown={() => setShowOriginal(true)}
                  onPointerUp={() => setShowOriginal(false)}
                  onPointerLeave={() => setShowOriginal(false)}
                  onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setShowOriginal(true)}
                  onKeyUp={() => setShowOriginal(false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Maintenir pour voir l&apos;original
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, intensity: 0 }))}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Revenir à l&apos;original
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Nouvelle photo
                </button>
              </div>

              {/* Export */}
              <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Exporter</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                    Format
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    >
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG (sans perte)</option>
                      <option value="webp">WebP</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
                    Résolution
                    <select
                      value={String(exportResolution)}
                      onChange={(e) => setExportResolution(e.target.value === "original" ? "original" : Number(e.target.value))}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    >
                      <option value="original">
                        Originale ({preview.analysis.sourceWidth}×{preview.analysis.sourceHeight})
                      </option>
                      {resolutionOptions.map((v) => (
                        <option key={v} value={v}>
                          {v} px (grand côté)
                        </option>
                      ))}
                    </select>
                  </label>
                  {exportFormat !== "png" ? (
                    <Slider label="Qualité" value={exportQuality} onChange={(v) => setExportQuality(Math.max(1, v))} />
                  ) : (
                    <p className="self-end text-[11px] text-zinc-400">PNG : compression sans perte.</p>
                  )}
                </div>
                {format?.format === "raw" && (
                  <p className="text-[11px] text-zinc-400">
                    Fichier RAW : l&apos;export est une image développée (JPEG/PNG/WebP), pas un fichier RAW.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleExport()}
                  disabled={exporting || busy}
                  className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
                >
                  {exporting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
                      Export en pleine résolution…
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Exporter la photo retouchée
                    </>
                  )}
                </button>
                {dirty && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Les réglages modifiés ne sont pas encore appliqués : l&apos;export utilisera ceux de l&apos;aperçu affiché.
                  </p>
                )}
                {lastExport && <p className="text-[11px] text-zinc-500">Dernier export : {lastExport}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
