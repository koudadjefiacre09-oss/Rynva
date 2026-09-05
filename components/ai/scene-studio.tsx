"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Download, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";
import type { CharacterWithUrl } from "@/lib/characters/list";

const MAX_CHARACTERS = 3;

const ASPECT_RATIOS = [
  { value: "16:9", label: "Paysage (16:9)" },
  { value: "1:1", label: "Carré (1:1)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "4:3", label: "Standard (4:3)" },
] as const;

interface SceneResult {
  url: string;
  prompt: string;
  generationId?: string;
}

export function SceneStudio({ characters }: { characters: CharacterWithUrl[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("16:9");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SceneResult | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= MAX_CHARACTERS) return prev;
      return [...prev, id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || selected.length < 2 || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, characterIds: selected, aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setResult(data);
        notifySuccess("Votre scène est prête !");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  if (characters.length < 2) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            AI Scene
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Combinez 2 ou 3 personnages dans une même scène, en gardant leur visage cohérent.
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Au moins 2 personnages requis
            </p>
            <p className="max-w-sm text-xs text-zinc-500">
              Créez vos personnages dans la bibliothèque pour pouvoir les combiner dans une scène.
            </p>
            <Link
              href="/characters"
              className="mt-1 inline-flex h-9 items-center justify-center rounded-full bg-zinc-900 px-4 text-xs font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Créer des personnages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          AI Scene
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sélectionnez 2 à 3 personnages, puis décrivez la scène : leur visage reste cohérent.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">
              Personnages ({selected.length}/{MAX_CHARACTERS})
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {characters.map((character) => {
                const isSelected = selected.includes(character.id);
                const disabled = !isSelected && selected.length >= MAX_CHARACTERS;
                return (
                  <button
                    key={character.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(character.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 transition-colors",
                      isSelected
                        ? "border-zinc-900 dark:border-white"
                        : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700",
                      disabled && "opacity-40"
                    )}
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={character.url}
                        alt={character.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="line-clamp-1 text-xs text-zinc-500">{character.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex : assis à une table de café, en pleine conversation, lumière chaude de fin d'après-midi"
              rows={3}
              maxLength={4000}
              className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-100/80 px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500"
            />

            <div className="flex flex-col gap-1.5">
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
                        ? "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={selected.length < 2 || !prompt.trim() || loading}
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Générer la scène
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt={result.prompt} className="w-full rounded-md" />
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={result.url} download target="_blank" rel="noreferrer">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800">
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </span>
                </a>
                <Link
                  href={`/ai/video?sourceUrl=${encodeURIComponent(result.url)}${
                    result.generationId ? `&sourceId=${result.generationId}` : ""
                  }`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Animer
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
