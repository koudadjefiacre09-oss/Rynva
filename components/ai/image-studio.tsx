"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, Download, Paperclip, Sparkles } from "lucide-react";
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
  "Un dragon d'origami en papier doré sur fond de nuit étoilée",
  "Une ville sous-marine bioluminescente, style aquarelle",
];

/**
 * Standalone (doesn't use the shared GenerationStudio) so this redesign
 * stays scoped to /ai/image — the other AI tools keep the default look.
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
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-white px-4 py-12 dark:bg-black lg:-m-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            AI Image
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Décrivez l&rsquo;image à générer : sujet, style, ambiance, lumière.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 pl-3 shadow-sm transition-colors focus-within:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none dark:focus-within:border-zinc-700">
            <button
              type="button"
              disabled
              title="Import d'image, bientôt disponible"
              className="mb-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:disabled:hover:text-zinc-500"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ex : un renard bleu néon dans une forêt cyberpunk, style illustration digitale"
              rows={1}
              maxLength={4000}
              className="max-h-40 min-h-[2.25rem] flex-1 resize-none self-center bg-transparent py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none dark:text-white dark:placeholder:text-zinc-500"
            />

            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              aria-label="Générer"
              className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
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
        </form>

        {error && (
          <p className="w-full rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
            {error}
          </p>
        )}

        {result ? (
          <div className="flex w-full flex-col gap-3">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt={result.prompt} className="w-full" />
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
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setPrompt(suggestion)}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left text-sm text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
