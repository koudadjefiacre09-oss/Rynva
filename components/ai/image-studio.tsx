"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ChevronDown,
  Download,
  Grid2x2,
  ImageIcon,
  Lightbulb,
  Palette,
  RefreshCw,
  Ratio,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";
import { deletePromptPreset } from "@/app/(app)/ai/image/actions";
import type { PromptPreset } from "@/lib/prompts/types";

interface ImageResult {
  urls: string[];
  prompt: string;
  generationIds: (string | undefined)[];
}

const ASPECT_RATIOS = [
  { value: "2:3", label: "Allongé" },
  { value: "3:2", label: "Large" },
  { value: "1:1", label: "Carré" },
  { value: "9:16", label: "Vertical" },
  { value: "16:9", label: "Panoramique" },
] as const;

// flux-schnell has no "style" parameter — a Style pill only stays honest by
// actually changing what gets sent to the model, so each option is really a
// suffix appended to the user's prompt at generation time (never shown back
// in the textarea, so their own wording stays clean).
const STYLES = [
  { value: "none", label: "Aucun", modifier: "" },
  { value: "realistic", label: "Réaliste", modifier: ", photographie réaliste, détails nets, éclairage naturel" },
  { value: "anime", label: "Anime", modifier: ", style anime, illustration 2D, couleurs vives" },
  { value: "cyberpunk", label: "Cyberpunk", modifier: ", style cyberpunk, néons, ambiance futuriste" },
  { value: "watercolor", label: "Aquarelle", modifier: ", style aquarelle, peinture douce, papier texturé" },
  { value: "3d", label: "3D", modifier: ", rendu 3D, style animation Pixar" },
] as const;

// flux-schnell genuinely supports 1-4 outputs per call (see lib/ai/providers
// /replicate.ts). One credit is consumed regardless of how many variations
// come back (see lib/credits/gate.ts) — 2 keeps generation faster and
// cheaper on the Replicate side without changing what the user pays.
const VARIATIONS = 2;

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
 * The composer (prompt + format + style + send, all in one bar) and the
 * prompt library are inspired by a reference the user shared — deliberately
 * without the parts of it RYNVA can't actually back: no model picker (one
 * image model), no negative prompt or reference-image conditioning (not
 * supported by that model), no steps slider (flux-schnell caps inference
 * steps at 4, nowhere near a meaningful slider), no credit-pack purchase
 * widget (no payment provider wired). Style is real but not a model
 * parameter — flux-schnell doesn't have one, so each option just appends a
 * suffix to the prompt (see STYLES above). The prompt library is real.
 */
export function ImageStudio({ initialPresets = [] }: { initialPresets?: PromptPreset[] }) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] =
    useState<(typeof ASPECT_RATIOS)[number]["value"]>("1:1");
  const [style, setStyle] = useState<(typeof STYLES)[number]["value"]>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const [presets, setPresets] = useState<PromptPreset[]>(initialPresets);

  async function generate() {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setFocusedIndex(null);

    const styleModifier = STYLES.find((s) => s.value === style)?.modifier ?? "";

    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${prompt}${styleModifier}`, aspectRatio, variations: VARIATIONS }),
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

  async function handleDeletePreset(id: string) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    await deletePromptPreset(id);
  }

  const focusedUrl = result && focusedIndex !== null ? result.urls[focusedIndex] : null;
  const focusedGenerationId =
    result && focusedIndex !== null ? result.generationIds[focusedIndex] : undefined;

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 lg:-m-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[440px_1fr] lg:items-start">
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
            <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-200 px-1 pb-1 pt-2 dark:border-zinc-700/60">
              <PillSelect
                icon={Ratio}
                label="Format"
                value={aspectRatio}
                onChange={(v) => setAspectRatio(v as (typeof ASPECT_RATIOS)[number]["value"])}
                options={ASPECT_RATIOS.map((r) => ({ value: r.value, display: `${r.value} ${r.label}` }))}
              />
              <PillSelect
                icon={Palette}
                label="Style"
                value={style}
                onChange={(v) => setStyle(v as (typeof STYLES)[number]["value"])}
                options={STYLES.map((s) => ({ value: s.value, display: s.label }))}
              />

              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                aria-label="Générer"
                className="ml-auto flex h-9 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 text-xs font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
              >
                {loading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" />
                )}
                Générer (1 crédit)
              </button>
            </div>
          </form>

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
                Vos prompts enregistrés apparaîtront ici.
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

/**
 * A native <select> styled as a rounded icon pill with the current value +
 * chevron (e.g. "▭ Carré ⌄") — matches the icon-pill toolbar look from the
 * Zenux reference (icon conveys the category, same way its "4 Images" / "2K"
 * pills don't repeat a category word either), applied to the one setting
 * that's actually real (aspect ratio). A plain <select> keeps this
 * keyboard/screen-reader accessible for free instead of building a custom
 * listbox — `aria-label` carries the category name for screen readers since
 * the visible label was dropped from the pill itself.
 */
function PillSelect({
  icon: Icon,
  label,
  value,
  onChange,
  options,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; display: string }[];
}) {
  return (
    <div className="relative flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-white pl-2.5 pr-6 dark:border-zinc-700 dark:bg-zinc-900">
      {Icon && <Icon className="h-3 w-3 shrink-0 text-zinc-400" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="peer appearance-none bg-transparent text-[11px] font-medium text-zinc-700 focus-visible:outline-none dark:text-zinc-300"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.display}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400 peer-focus-visible:text-zinc-600" />
    </div>
  );
}
