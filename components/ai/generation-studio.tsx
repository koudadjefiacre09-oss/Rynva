"use client";

import { useState } from "react";
import { ArrowUp, Download, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";

export interface StudioField {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

interface BaseResult {
  url: string;
  prompt: string;
}

/**
 * Shared two-panel studio shell: a settings card (prompt + fields + submit)
 * on the left, a result canvas on the right — same composition as
 * components/ai/image-studio.tsx, generic enough to back several tools
 * (currently Audio and Design) from one config-driven component instead of
 * duplicating the layout per tool.
 */
export function GenerationStudio<TResult extends BaseResult>({
  title,
  description,
  endpoint,
  placeholder,
  submitLabel = "Générer",
  successMessage = "Votre création est prête !",
  fields = [],
  renderResult,
  renderExtraActions,
  emptyIcon: EmptyIcon = Sparkles,
  emptyLabel = "Votre création apparaîtra ici une fois générée.",
}: {
  title: string;
  description: string;
  endpoint: string;
  placeholder: string;
  submitLabel?: string;
  /** Toast shown on success — pass a gendered message ("Votre vidéo est prête !"). */
  successMessage?: string;
  fields?: StudioField[];
  renderResult: (result: TResult) => React.ReactNode;
  renderExtraActions?: (result: TResult) => React.ReactNode;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  emptyLabel?: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.name, field.options[0]?.value ?? ""]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, ...options }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setResult(data);
        notifySuccess(successMessage);
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
            {title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="studio-prompt" className="text-xs font-medium text-zinc-500">
            Prompt
          </label>
          <textarea
            id="studio-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            rows={5}
            maxLength={4000}
            className="resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>

        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">{field.label}</span>
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOptions((prev) => ({ ...prev, [field.name]: opt.value }))}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    options[field.name] === opt.value
                      ? "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}

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
              {submitLabel}
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
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <div className="w-full overflow-hidden rounded-2xl">{renderResult(result)}</div>
            <div className="flex flex-wrap justify-center gap-2">
              <a href={result.url} download target="_blank" rel="noreferrer">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </span>
              </a>
              {renderExtraActions?.(result)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              <EmptyIcon className="h-6 w-6" />
            </span>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">{emptyLabel}</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
