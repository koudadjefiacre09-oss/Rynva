"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, Sparkles, Download, Users } from "lucide-react";
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
      <div className="-m-4 flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950 lg:-m-6 lg:px-8">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            Au moins 2 personnages requis
          </p>
          <p className="text-xs text-zinc-500">
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
    );
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 lg:-m-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Générez votre scène
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Sélectionnez 2 à 3 personnages, puis décrivez la scène : leur visage reste cohérent.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">
              Personnages ({selected.length}/{MAX_CHARACTERS})
            </span>
            <div className="grid grid-cols-4 gap-2">
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
                      "flex flex-col items-center gap-1 rounded-xl border-2 p-1 transition-colors",
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
                    <span className="line-clamp-1 text-[10px] text-zinc-500">{character.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="scene-prompt" className="text-xs font-medium text-zinc-500">
              Prompt
            </label>
            <textarea
              id="scene-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex : assis à une table de café, en pleine conversation, lumière chaude de fin d'après-midi"
              rows={4}
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

          <button
            type="submit"
            disabled={selected.length < 2 || !prompt.trim() || loading}
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
                Générer la scène
              </>
            )}
          </button>
        </form>

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
              <div className="w-full overflow-hidden rounded-2xl">
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
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <Users className="h-6 w-6" />
              </span>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Votre scène apparaîtra ici une fois générée.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
