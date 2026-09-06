"use client";

import { useState } from "react";
import { ArrowUp, AudioLines, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";

interface AudioResult {
  url: string;
  prompt: string;
}

const VOICE_STYLES = [
  { value: "neutral", label: "Neutre" },
  { value: "warm", label: "Chaleureuse" },
  { value: "energetic", label: "Énergique" },
  { value: "narration", label: "Narration" },
] as const;

const SUGGESTIONS = [
  "Une voix off chaleureuse annonçant le lancement de RYNVA, ton confiant",
  "Une narration posée pour une vidéo documentaire sur la nature",
  "Un jingle énergique de 10 secondes pour une publicité",
  "Une voix neutre qui lit un message d'accueil pour un serveur vocal",
];

/**
 * Standalone (doesn't use the shared GenerationStudio) so this redesign
 * stays scoped to /ai/audio — the other simple-form tools keep the default
 * look. Centered "welcome" layout with a chat-style prompt bar, inspired by
 * the reference the user shared — adapted to what RYNVA's audio tool
 * actually does (one prompt, four voice styles) rather than copied wholesale:
 * no fabricated Voice Library / cloning / dubbing / audiobook sections,
 * since none of that exists here.
 */
export function AudioStudio() {
  const [prompt, setPrompt] = useState("");
  const [voice, setVoice] = useState<(typeof VOICE_STYLES)[number]["value"]>("neutral");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AudioResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, voice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setResult(data);
        notifySuccess("Votre audio est prêt !");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="-m-4 flex min-h-[calc(100vh-4rem)] flex-col items-center bg-zinc-50 px-4 py-14 dark:bg-zinc-950 lg:-m-6 lg:px-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white">
          <AudioLines className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Générez votre audio
        </h1>
        <p className="max-w-md text-sm text-zinc-500">
          Voix off, musique d&rsquo;ambiance ou effet sonore : décrivez ce que vous voulez entendre.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-2xl">
        <div className="flex flex-col gap-2 rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex : une voix off chaleureuse annonçant le lancement de RYNVA, ton confiant"
            rows={2}
            maxLength={4000}
            className="resize-none bg-transparent px-2 pt-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none dark:text-white dark:placeholder:text-zinc-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
            <div className="flex flex-wrap gap-1.5">
              {VOICE_STYLES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVoice(v.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    voice === v.value
                      ? "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
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

      <div className="mt-6 w-full max-w-2xl">
        {error ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
            {error}
          </p>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-6 text-zinc-400 dark:text-zinc-500">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
            <p className="text-sm">Génération en cours...</p>
          </div>
        ) : result ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <audio controls src={result.url} className="w-full" />
            <a href={result.url} download target="_blank" rel="noreferrer">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
                <Download className="h-3.5 w-3.5" />
                Télécharger
              </span>
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="px-1 text-xs font-medium text-zinc-500">Idées</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setPrompt(suggestion)}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
