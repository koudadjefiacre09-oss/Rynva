"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Bookmark,
  Check,
  Download,
  Grid2x2,
  ImageIcon,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";
import { deletePromptPreset, savePromptPreset } from "@/app/(app)/ai/image/actions";
import type { PromptPreset } from "@/lib/prompts/types";

interface ImageResult {
  urls: string[];
  prompt: string;
  generationIds: (string | undefined)[];
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
  "Un portrait de studio, éclairage dramatique, fond noir",
  "Une scène de rue pluvieuse la nuit, néons reflétés au sol",
];

/**
 * Standalone (doesn't use the shared GenerationStudio) so this redesign
 * stays scoped to /ai/image — the other AI tools keep the default look.
 *
 * Two-panel layout (settings card on the left, result canvas on the right,
 * both floating rounded-3xl cards over a neutral page). The right panel
 * shows every variation from one request as a 2x2 grid (one credit consumed
 * regardless of how many variations come back — see lib/credits/gate.ts),
 * with a click-to-focus single view. No fabricated chat/AI commentary text
 * around results — RYNVA doesn't generate that, so the panel only ever
 * shows what actually happened: the prompt and the images.
 *
 * The composer (prompt + format + send, all in one bar) and the prompt
 * library are inspired by a reference the user shared — deliberately
 * without the parts of it RYNVA can't actually back: no model picker (one
 * image model), no negative prompt or reference-image conditioning (not
 * supported by that model), no steps/style sliders (flux-schnell caps
 * inference steps at 4, nowhere near a meaningful slider), no credit-pack
 * purchase widget (no payment provider wired). The prompt library is real.
 */
export function ImageStudio({ initialPresets = [] }: { initialPresets?: PromptPreset[] }) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] =
    useState<(typeof ASPECT_RATIOS)[number]["value"]>("1:1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const [presets, setPresets] = useState<PromptPreset[]>(initialPresets);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetLabel, setPresetLabel] = useState("");
  const [presetError, setPresetError] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setFocusedIndex(null);

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
        setResult({ urls: data.urls, prompt: data.prompt, generationIds: data.generationIds });
        notifySuccess(
          data.urls.length > 1 ? "Vos images sont prêtes !" : "Votre image est prête !"
        );
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await generate();
  }

  async function confirmSavePreset() {
    const saveResult = await savePromptPreset(presetLabel, prompt);
    if (saveResult.error) {
      setPresetError(saveResult.error);
      return;
    }
    if (saveResult.preset) setPresets((prev) => [saveResult.preset!, ...prev]);
    setSavingPreset(false);
    setPresetLabel("");
    setPresetError(null);
  }

  async function handleDeletePreset(id: string) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    await deletePromptPreset(id);
  }

  const focusedUrl = result && focusedIndex !== null ? result.urls[focusedIndex] : null;
  const focusedGenerationId =
    result && focusedIndex !== null ? result.generationIds[focusedIndex] : undefined;

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 lg:-m-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* Settings panel */}
        <div className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Générez votre image
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Sujet, style, ambiance, lumière : décrivez ce que vous voulez voir.
            </p>
          </div>

          {/* Composer — prompt, format and send together in one bar. */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
          >
            <textarea
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex : un renard bleu néon dans une forêt cyberpunk, style illustration digitale"
              rows={4}
              maxLength={4000}
              className="resize-none bg-transparent px-1 pt-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none dark:text-white dark:placeholder:text-zinc-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
              <div className="flex flex-wrap gap-1.5">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    type="button"
                    onClick={() => setAspectRatio(ratio.value)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      aspectRatio === ratio.value
                        ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSavingPreset(true);
                    setPresetError(null);
                  }}
                  disabled={!prompt.trim()}
                  title="Enregistrer ce prompt"
                  aria-label="Enregistrer ce prompt"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  disabled={!prompt.trim() || loading}
                  aria-label="Générer"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </form>

          {savingPreset && (
            <div className="-mt-2 flex flex-col gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              <input
                autoFocus
                value={presetLabel}
                onChange={(e) => setPresetLabel(e.target.value)}
                placeholder="Nom de ce prompt (ex : Portrait néon)"
                maxLength={60}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-brand-purple dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
              />
              {presetError && <p className="text-xs text-danger">{presetError}</p>}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={confirmSavePreset}
                  disabled={!presetLabel.trim()}
                  className="flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavingPreset(false);
                    setPresetError(null);
                  }}
                  className="flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Suggestions — horizontal scroll of quick-start ideas. */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">Idées</span>
            <div className="thin-scrollbar flex gap-2 overflow-x-auto pb-1">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setPrompt(suggestion)}
                  className="flex w-40 shrink-0 flex-col gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-left text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-800/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <Lightbulb className="h-3.5 w-3.5 shrink-0 text-brand-purple" />
                  <span className="line-clamp-3">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt library — real, unlike the reference's other advanced panels. */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">Bibliothèque de prompts</span>
            {presets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
                Enregistrez un prompt (icône signet ci-dessus) pour le retrouver ici.
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  >
                    <button
                      type="button"
                      onClick={() => setPrompt(preset.prompt)}
                      title={preset.prompt}
                      className="min-w-0 flex-1 truncate text-left text-xs text-zinc-700 dark:text-zinc-300"
                    >
                      {preset.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                      aria-label="Supprimer ce prompt"
                      className="shrink-0 rounded-lg p-1 text-zinc-300 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 dark:text-zinc-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Result canvas */}
        <div className="flex min-h-[420px] flex-col rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:min-h-[600px]">
          {error ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="max-w-sm rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
                {error}
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-500">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
              <p className="text-sm">Génération en cours...</p>
            </div>
          ) : result ? (
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {focusedUrl && (
                    <button
                      type="button"
                      onClick={() => setFocusedIndex(null)}
                      aria-label="Retour à la grille"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                    >
                      <Grid2x2 className="h-4 w-4" />
                    </button>
                  )}
                  {result.urls.length > 1
                    ? `${result.urls.length} variations`
                    : "Résultat"}
                </div>
                <p className="max-w-md truncate text-xs text-zinc-400" title={result.prompt}>
                  {result.prompt}
                </p>
              </div>

              {focusedUrl ? (
                <div className="flex flex-1 flex-col items-center gap-4">
                  <div className="flex max-h-[60vh] w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={focusedUrl} alt={result.prompt} className="max-h-[60vh] w-auto" />
                  </div>
                  <ResultActions
                    url={focusedUrl}
                    prompt={result.prompt}
                    generationId={focusedGenerationId}
                    onRegenerate={generate}
                  />
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-4">
                  <div
                    className={cn(
                      "grid flex-1 gap-3",
                      result.urls.length > 1 ? "grid-cols-2" : "grid-cols-1"
                    )}
                  >
                    {result.urls.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setFocusedIndex(i)}
                        className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${result.prompt} — variation ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                      </button>
                    ))}
                  </div>
                  <ResultActions
                    url={result.urls[0]}
                    prompt={result.prompt}
                    generationId={result.generationIds[0]}
                    onRegenerate={generate}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
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

function ResultActions({
  url,
  prompt,
  generationId,
  onRegenerate,
}: {
  url: string;
  prompt: string;
  generationId?: string;
  onRegenerate: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={onRegenerate}
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Régénérer
      </button>
      <a href={url} download target="_blank" rel="noreferrer">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
          <Download className="h-3.5 w-3.5" />
          Télécharger
        </span>
      </a>
      <Link
        href={`/ai/video?sourceUrl=${encodeURIComponent(url)}${
          generationId ? `&sourceId=${generationId}` : ""
        }`}
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Animer
      </Link>
    </div>
  );
}
