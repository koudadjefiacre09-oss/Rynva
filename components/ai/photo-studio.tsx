"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Upload, Eraser, Sparkles, Download, User, Loader2 } from "lucide-react";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          AI Photo
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Importez une photo puis choisissez un traitement à lui appliquer.
        </p>
      </div>

      {/* Tool switcher */}
      <div className="flex gap-2 rounded-2xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => selectTool("bg-remove")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            tool === "bg-remove"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
          )}
        >
          <Eraser className="h-4 w-4" />
          Retirer l&apos;arrière-plan
        </button>
        <button
          type="button"
          onClick={() => selectTool("hd-enhance")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            tool === "hd-enhance"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Améliorer HD
        </button>
      </div>

      <div className="rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950/50 dark:hover:border-zinc-600"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 dark:bg-white">
                <Upload className="h-5 w-5 text-white dark:text-zinc-900" />
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Cliquez pour importer une photo
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">PNG, JPG ou WebP — 10 Mo max</p>
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">Original</p>
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Photo importée" className="w-full object-contain" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  {tool === "bg-remove" ? "Sans arrière-plan" : "Améliorée"}
                </p>
                <div
                  className="flex min-h-[120px] items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
                  style={tool === "bg-remove" ? TRANSPARENT_BG_STYLE : undefined}
                >
                  {result ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.url} alt="Résultat" className="w-full object-contain" />
                  ) : (
                    <p className="p-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                      Le résultat apparaîtra ici
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {preview && tool === "hd-enhance" && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Facteur</span>
                <div className="flex overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
                  {([2, 4] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScale(s)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold transition-colors",
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
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
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

          {preview && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRun}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : tool === "bg-remove" ? (
                  <Eraser className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {tool === "bg-remove" ? "Retirer l'arrière-plan" : `Améliorer en ${scale}x`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  resetOutput();
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Changer de photo
              </button>
              {result && (
                <>
                  <a href={result.url} download target="_blank" rel="noreferrer">
                    <span className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      <Download className="h-4 w-4" />
                      Télécharger
                    </span>
                  </a>
                  <Link
                    href={`/ai/video?sourceUrl=${encodeURIComponent(result.url)}${
                      result.generationId ? `&sourceId=${result.generationId}` : ""
                    }`}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Sparkles className="h-4 w-4" />
                    Animer
                  </Link>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
