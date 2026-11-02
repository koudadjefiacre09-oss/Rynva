"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Search, CheckSquare, Square, Download, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";
import type { GenerationWithUrl } from "@/lib/generations/list";
import type { GenerationType } from "@/lib/generations/types";
import { ProjectCard } from "@/components/gallery/project-card";

type Filter = "all" | "image" | "video" | "design" | "audio" | "photo" | "scene";

const FILTERS: { value: Filter; label: string; types?: GenerationType[] }[] = [
  { value: "all", label: "Tout" },
  { value: "image", label: "Images", types: ["image"] },
  { value: "video", label: "Vidéos", types: ["video"] },
  { value: "design", label: "Design", types: ["design"] },
  { value: "audio", label: "Audio", types: ["audio"] },
  { value: "photo", label: "Photo", types: ["photo-bg-remove", "photo-enhance"] },
  { value: "scene", label: "Scènes", types: ["scene"] },
];

type Sort = "recent" | "oldest" | "favorites";

/** Normalises for accent-insensitive search ("ete" finds "été"). */
function fold(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function GalleryGrid({ items }: { items: GenerationWithUrl[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const types = FILTERS.find((f) => f.value === filter)?.types;
    const q = fold(query.trim());
    const result = list.filter(
      (item) => (!types || types.includes(item.type)) && (!q || fold(item.prompt ?? "").includes(q))
    );
    if (sort === "oldest") result.sort((a, b) => a.created_at.localeCompare(b.created_at));
    else if (sort === "favorites") result.sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite) || b.created_at.localeCompare(a.created_at));
    else result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return result;
  }, [list, filter, query, sort]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelection() {
    setSelecting(false);
    setSelected(new Set());
  }

  async function downloadSelected() {
    const picked = list.filter((item) => selected.has(item.id));
    // One anchor click per file, spaced out: browsers drop rapid bursts.
    for (const item of picked) {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = "";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  async function trashSelected() {
    const ids = [...selected];
    if (!window.confirm(`Déplacer ${ids.length} projet${ids.length > 1 ? "s" : ""} à la corbeille ?`)) return;
    setBusy(true);
    const results = await Promise.all(
      ids.map((id) => fetch(`/api/generations/${id}`, { method: "DELETE" }).then((r) => (r.ok ? id : null)).catch(() => null))
    );
    const done = new Set(results.filter((id): id is string => Boolean(id)));
    setList((prev) => prev.filter((item) => !done.has(item.id)));
    setBusy(false);
    exitSelection();
    if (done.size) notifySuccess(`${done.size} projet${done.size > 1 ? "s" : ""} déplacé${done.size > 1 ? "s" : ""} à la corbeille.`);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 py-24 text-center dark:border-zinc-800">
        <ImageIcon className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
        <p className="text-sm font-medium text-zinc-900 dark:text-white">Aucun projet pour le moment</p>
        <p className="max-w-sm text-sm text-zinc-500">
          Vos images, vidéos, designs et audios générés apparaîtront ici automatiquement.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans vos prompts…"
            className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </label>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Trier"
            className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="recent">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="favorites">Favoris d&apos;abord</option>
          </select>
          <button
            type="button"
            onClick={() => (selecting ? exitSelection() : setSelecting(true))}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
              selecting
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            )}
          >
            <CheckSquare className="h-4 w-4" />
            {selecting ? "Terminer" : "Sélectionner"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
          {filtered.length} projet{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {selecting && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white/95 p-2 pl-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set(filtered.map((i) => i.id)))}
            className="text-xs font-medium text-zinc-500 underline-offset-2 hover:underline"
          >
            Tout sélectionner
          </button>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              disabled={selected.size === 0 || busy}
              onClick={() => void downloadSelected()}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              <Download className="h-3.5 w-3.5" />
              Télécharger
            </button>
            <button
              type="button"
              disabled={selected.size === 0 || busy}
              onClick={() => void trashSelected()}
              className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Corbeille
            </button>
            <button
              type="button"
              onClick={exitSelection}
              aria-label="Annuler la sélection"
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-600">
          {query ? "Aucun projet ne correspond à cette recherche." : "Rien dans cette catégorie pour l'instant."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className="relative">
              <ProjectCard item={item} />
              {selecting && (
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={selected.has(item.id)}
                  aria-label={selected.has(item.id) ? "Désélectionner" : "Sélectionner"}
                  className={cn(
                    "absolute inset-0 z-10 flex items-start justify-start rounded-2xl p-3 transition-colors",
                    selected.has(item.id) ? "bg-brand-purple/15 ring-2 ring-brand-purple" : "bg-white/0 hover:bg-black/5"
                  )}
                >
                  <span className="rounded-md bg-white p-0.5 text-zinc-900 shadow dark:bg-zinc-900 dark:text-white">
                    {selected.has(item.id) ? <CheckSquare className="h-5 w-5 text-brand-purple" /> : <Square className="h-5 w-5" />}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
