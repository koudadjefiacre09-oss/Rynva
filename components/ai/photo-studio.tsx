"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Upload, Eraser, Sparkles, Download, User, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

type Tool = "bg-remove" | "hd-enhance";

const TRANSPARENT_BG_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, rgb(var(--color-checker)) 25%, transparent 25%), linear-gradient(-45deg, rgb(var(--color-checker)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgb(var(--color-checker)) 75%), linear-gradient(-45deg, transparent 75%, rgb(var(--color-checker)) 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
};

export function PhotoStudio() {
  const [tool, setTool] = useState<Tool>("bg-remove");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; generationId?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<2 | 4>(4);
  const [faceEnhance, setFaceEnhance] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetOutput() {
    setResult(null);
    setError(null);
  }

  function selectTool(next: Tool) {
    setTool(next);
    resetOutput();
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    resetOutput();

    if (!file.type.startsWith("image/")) {
      setError("Choisissez un fichier image (PNG, JPG, WebP...).");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image trop volumineuse (10 Mo max).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleRun() {
    if (!preview || loading) return;
    setLoading(true);
    resetOutput();

    const endpoint = tool === "bg-remove" ? "/api/ai/photo/remove-background" : "/api/ai/photo/enhance";
    const body =
      tool === "bg-remove"
        ? { imageDataUrl: preview }
        : { imageDataUrl: preview, scale, faceEnhance };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setResult({ url: data.url, generationId: data.generationId });
        notifySuccess("Votre photo est prête !");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 lg:-m-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* Settings panel */}
        <div className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Retouchez votre photo
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Importez une photo puis choisissez un traitement à lui appliquer.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <div className="flex gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-800/50">
            <button
              type="button"
              onClick={() => selectTool("bg-remove")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition-colors",
                tool === "bg-remove"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              )}
            >
              <Eraser className="h-3.5 w-3.5" />
              Fond
            </button>
            <button
              type="button"
              onClick={() => selectTool("hd-enhance")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition-colors",
                tool === "hd-enhance"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              HD
            </button>
          </div>

          {preview && (
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Photo importée" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  resetOutput();
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-white"
              >
                Changer de photo
              </button>
            </div>
          )}

          {tool === "hd-enhance" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-500">Facteur</span>
                <div className="flex w-fit overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
                  {([2, 4] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScale(s)}
                      className={cn(
                        "px-3.5 py-1.5 text-xs font-semibold transition-colors",
                        scale === s
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "bg-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                      )}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFaceEnhance((v) => !v)}
                className={cn(
                  "flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  faceEnhance
                    ? "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    : "border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                )}
              >
                <User className="h-3.5 w-3.5" />
                Amélioration des visages
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => (preview ? handleRun() : fileInputRef.current?.click())}
            disabled={loading}
            className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
                Traitement...
              </>
            ) : preview ? (
              <>
                {tool === "bg-remove" ? (
                  <Eraser className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {tool === "bg-remove" ? "Retirer l'arrière-plan" : `Améliorer en ${scale}x`}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Importer une photo
              </>
            )}
          </button>
        </div>

        {/* Result canvas */}
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:min-h-[600px]">
          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-10 py-16 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <Upload className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Cliquez pour importer une photo
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">PNG, JPG ou WebP (10 Mo max)</p>
            </button>
          ) : loading ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400 dark:text-zinc-500">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
              <p className="text-sm">Traitement en cours...</p>
            </div>
          ) : result ? (
            <div className="flex w-full max-w-md flex-col items-center gap-4">
              <div
                className="flex w-full items-center justify-center overflow-hidden rounded-2xl"
                style={tool === "bg-remove" ? TRANSPARENT_BG_STYLE : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt="Résultat" className="w-full object-contain" />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <a href={result.url} download target="_blank" rel="noreferrer">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </span>
                </a>
                <Link
                  href={`/ai/video?sourceUrl=${encodeURIComponent(result.url)}${
                    result.generationId ? `&sourceId=${result.generationId}` : ""
                  }`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Animer
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-md flex-col items-center gap-3">
              <div className="w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Photo importée" className="w-full object-contain" />
              </div>
              <p className="flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
                <ImageIcon className="h-3.5 w-3.5" />
                Prêt : lancez le traitement depuis le panneau de gauche.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
