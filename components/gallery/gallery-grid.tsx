"use client";

import { useMemo, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GenerationWithUrl } from "@/lib/generations/list";
import type { GenerationType } from "@/lib/generations/types";
import { ProjectCard } from "@/components/gallery/project-card";

const FILTERS: { value: "all" | GenerationType; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "image", label: "Images" },
  { value: "video", label: "Vidéos" },
  { value: "design", label: "Design" },
  { value: "audio", label: "Audio" },
  { value: "photo-bg-remove", label: "Photo" },
  { value: "scene", label: "Scènes" },
];

export function GalleryGrid({ items }: { items: GenerationWithUrl[] }) {
  const [filter, setFilter] = useState<"all" | GenerationType>("all");

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.type === filter)),
    [items, filter]
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border py-24 text-center">
        <ImageIcon className="mb-2 h-8 w-8 text-text-muted" strokeWidth={1.5} />
        <p className="text-sm font-medium text-text-primary">Aucun projet pour le moment</p>
        <p className="max-w-sm text-sm text-text-muted">
          Vos images, vidéos, designs et audios générés apparaîtront ici automatiquement.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm transition-colors",
              filter === f.value
                ? "bg-surface-secondary text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-muted">Rien dans cette catégorie pour l&apos;instant.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ProjectCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
