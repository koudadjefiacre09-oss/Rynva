"use client";

import { useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      <div className="rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              rows={4}
              maxLength={4000}
              className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-100/80 px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500"
            />

            {fields.length > 0 && (
              <div className="flex flex-wrap gap-5">
                {fields.map((field) => (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-zinc-500">{field.label}</span>
                    <div className="flex flex-wrap gap-2">
                      {field.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setOptions((prev) => ({ ...prev, [field.name]: opt.value }))
                          }
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                            options[field.name] === opt.value
                              ? "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                              : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {submitLabel}
            </button>
          </form>

          {error && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          {result && (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                {renderResult(result)}
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={result.url} download target="_blank" rel="noreferrer">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800">
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </span>
                </a>
                {renderExtraActions?.(result)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
