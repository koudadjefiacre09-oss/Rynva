"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Sparkles, Trash2, UserPlus, Check, X, Star, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { GenerationWithUrl } from "@/lib/generations/list";
import type { GenerationType } from "@/lib/generations/types";

export const TYPE_LABEL: Record<GenerationType, string> = {
  image: "Image",
  video: "Vidéo",
  design: "Design",
  audio: "Audio",
  "photo-bg-remove": "Photo",
  "photo-enhance": "Photo",
  scene: "Scène",
};

// Types whose result is a still image that can be sent to AI Video to animate.
export const ANIMATABLE: GenerationType[] = [
  "image",
  "design",
  "photo-bg-remove",
  "photo-enhance",
  "scene",
];

// Types that make sense as the reference image of a single reusable
// character — a multi-person "scene" is excluded, it isn't one consistent face.
const CAN_BECOME_CHARACTER: GenerationType[] = ["image", "design", "photo-bg-remove", "photo-enhance"];

// Shared style for the small action pills (Télécharger, Animer, Personnage) —
// contrasted border + text so they stay legible in both themes.
const ACTION_BUTTON =
  "flex items-center gap-1 rounded-full border border-zinc-300 px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-white";

function Media({ item }: { item: GenerationWithUrl }) {
  if (item.type === "video") {
    return <video src={item.url} controls className="h-full w-full object-cover" />;
  }
  if (item.type === "audio") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 p-3 dark:bg-zinc-800">
        <audio src={item.url} controls className="w-full" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src={item.url} alt={item.prompt ?? TYPE_LABEL[item.type]} className="h-full w-full object-cover" />
  );
}

export function ProjectCard({
  item,
  onToggleFavorite,
  variant = "default",
  onRemoveFromTrash,
}: {
  item: GenerationWithUrl;
  /** Called after a successful toggle — e.g. /favorites drops the card immediately on un-star. */
  onToggleFavorite?: (id: string, next: boolean) => void;
  /** "trash" swaps the usual actions (download/animate/star/delete) for Restaurer / Supprimer définitivement — used on /trash. */
  variant?: "default" | "trash";
  /** Called after a successful restore or permanent delete, so the trash grid can drop the card. */
  onRemoveFromTrash?: (id: string) => void;
}) {
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [favorite, setFavorite] = useState(item.is_favorite);
  const [favoriting, setFavoriting] = useState(false);
  const [savingChar, setSavingChar] = useState(false);
  const [charName, setCharName] = useState("");
  const [charSaving, setCharSaving] = useState(false);
  const [charSaved, setCharSaved] = useState(false);
  const [charError, setCharError] = useState<string | null>(null);

  if (deleted) return null;

  async function handleToggleFavorite() {
    if (favoriting) return;
    const next = !favorite;
    setFavoriting(true);
    setFavorite(next); // optimistic
    try {
      const res = await fetch(`/api/generations/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!res.ok) {
        setFavorite(!next); // revert
        return;
      }
      onToggleFavorite?.(item.id, next);
    } catch {
      setFavorite(!next);
    } finally {
      setFavoriting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Déplacer ce projet à la corbeille ?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/generations/${item.id}`, { method: "DELETE" });
      if (res.ok) setDeleted(true);
    } finally {
      setDeleting(false);
    }
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/generations/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });
      if (res.ok) {
        setDeleted(true);
        onRemoveFromTrash?.(item.id);
      }
    } finally {
      setRestoring(false);
    }
  }

  async function handlePermanentDelete() {
    if (!window.confirm("Supprimer définitivement ? Cette action est irréversible.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/generations/${item.id}?permanent=1`, { method: "DELETE" });
      if (res.ok) {
        setDeleted(true);
        onRemoveFromTrash?.(item.id);
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveAsCharacter() {
    if (!charName.trim() || charSaving) return;
    setCharSaving(true);
    setCharError(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: charName.trim(), imageUrl: item.url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCharError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setCharSaved(true);
      setSavingChar(false);
    } catch {
      setCharError("Impossible de contacter le serveur.");
    } finally {
      setCharSaving(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
        <Media item={item} />
        {variant === "default" && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={favoriting}
            aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={favorite}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-500 shadow-sm backdrop-blur transition-colors hover:text-amber-500 disabled:cursor-not-allowed dark:bg-black/60 dark:text-zinc-400"
          >
            <Star className={cn("h-3.5 w-3.5", favorite && "fill-amber-400 text-amber-400")} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{TYPE_LABEL[item.type]}</span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {formatRelativeTime(item.created_at)}
          </span>
        </div>
        {item.prompt && (
          <p className="line-clamp-2 text-xs text-zinc-900 dark:text-white">{item.prompt}</p>
        )}

        {savingChar ? (
          <div className="flex flex-col gap-1.5">
            <input
              autoFocus
              value={charName}
              onChange={(e) => setCharName(e.target.value)}
              placeholder="Nom du personnage"
              maxLength={60}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-brand-purple dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
            />
            {charError && <p className="text-xs text-danger">{charError}</p>}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleSaveAsCharacter}
                disabled={charSaving || !charName.trim()}
                className="flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Créer
              </button>
              <button
                type="button"
                onClick={() => {
                  setSavingChar(false);
                  setCharError(null);
                }}
                className="flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
                Annuler
              </button>
            </div>
          </div>
        ) : variant === "trash" ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleRestore}
              disabled={restoring || deleting}
              className={ACTION_BUTTON}
            >
              <RotateCcw className="h-3 w-3" />
              Restaurer
            </button>
            <button
              type="button"
              onClick={handlePermanentDelete}
              disabled={restoring || deleting}
              className="ml-auto flex items-center gap-1 rounded-full border border-zinc-300 px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:border-danger/50 hover:text-danger disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              <Trash2 className="h-3 w-3" />
              Supprimer
            </button>
          </div>
        ) : (
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <a href={item.url} download target="_blank" rel="noreferrer">
              <button type="button" className={ACTION_BUTTON}>
                <Download className="h-3 w-3" />
                Télécharger
              </button>
            </a>
            {ANIMATABLE.includes(item.type) && (
              <Link href={`/ai/video?sourceUrl=${encodeURIComponent(item.url)}&sourceId=${item.id}`}>
                <button type="button" className={ACTION_BUTTON}>
                  <Sparkles className="h-3 w-3" />
                  Animer
                </button>
              </Link>
            )}
            {CAN_BECOME_CHARACTER.includes(item.type) &&
              (charSaved ? (
                <span className="text-[11px] text-success">Personnage créé ✓</span>
              ) : (
                <button type="button" onClick={() => setSavingChar(true)} className={ACTION_BUTTON}>
                  <UserPlus className="h-3 w-3" />
                  Personnage
                </button>
              ))}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Déplacer à la corbeille"
              title="Déplacer à la corbeille"
              className="ml-auto flex items-center justify-center rounded-full border border-zinc-300 p-1 text-zinc-500 transition-colors hover:border-danger/50 hover:text-danger disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
