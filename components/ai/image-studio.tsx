"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, Download, ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";

interface ImageResult {
  url: string;
  prompt: string;
  generationId?: string;
}

const ASPECT_RATIOS = [
  { value: "1:1", label: "Carré" },
  { value: "16:9", label: "Paysage" },
  { value: "9:16", label: "Portrait" },
  { value: "4:3", label: "Standard" },
] as const;

const SUGGESTIONS = [
  "Un renard bleu néon dans une forêt cyberpunk, style illustration digitale",
  "Un chat qui vole au-dessus d'une ville flottante, lumière dorée",
  "Un astronaute qui cultive des fleurs sur la lune, art conceptuel",
  "Une bibliothèque infinie baignée de lumière violette, ambiance onirique",
];

/**
 * Standalone (doesn't use the shared GenerationStudio) so this redesign
 * stays scoped to /ai/image — the other AI tools keep the default look.
 *
 * Two-panel layout (settings card on the left, result canvas on the right,
 * both floating rounded-3xl cards over a neutral page) — composition
 * inspired by desktop creative tools with a fixed left rail + canvas, not
 * copied from any one of them: colors, spacing and every component here are
 * RYNVA's own (see components/ui, lib/utils's cn, the zinc/brand palette).
 */
export function ImageStudio() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] =
    useState<(typeof ASPECT_RATIOS)[number]["value"]>("1:1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setResult(data);
        notifySuccess("Votre image est prête !");
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
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Générez votre image
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Sujet, style, ambiance, lumière : décrivez ce que vous voulez voir.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="image-prompt" className="text-xs font-medium text-zinc-500">
              Prompt
            </label>
            <textarea
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex : un renard bleu néon dans une forêt cyberpunk, style illustration digitale"
              rows={5}
              maxLength={4000}
              className="resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-white dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">Format</span>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  type="button"
                  onClick={() => setAspectRatio(ratio.value)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    aspectRatio === ratio.value
                      ? "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">Idées</span>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setPrompt(suggestion)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-800/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
                Génération...
              </>
            ) : (
              <>
                <ArrowUp className="h-4 w-4" />
                Générer
              </>
            )}
          </button>
        </form>

        {/* Result canvas */}
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:min-h-[600px]">
          {error ? (
            <p className="max-w-sm rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
              {error}
            </p>
          ) : loading ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400 dark:text-zinc-500">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
              <p className="text-sm">Génération en cours...</p>
            </div>
          ) : result ? (
            <div className="flex w-full flex-col items-center gap-4">
              <div className="max-h-[70vh] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt={result.prompt} className="mx-auto max-h-[70vh] w-auto" />
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
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <ImageIcon className="h-6 w-6" />
              </span>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Votre image apparaîtra ici une fois générée.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
