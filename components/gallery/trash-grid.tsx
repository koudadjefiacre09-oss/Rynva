"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ProjectCard } from "@/components/gallery/project-card";
import type { GenerationWithUrl } from "@/lib/generations/list";

export function TrashGrid({ initialItems }: { initialItems: GenerationWithUrl[] }) {
  const [items, setItems] = useState(initialItems);

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800/60 dark:bg-zinc-900/60">
        <Trash2 className="mb-1 h-7 w-7 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
        <p className="text-sm font-medium text-zinc-900 dark:text-white">La corbeille est vide</p>
        <p className="max-w-sm text-xs text-zinc-500">
          Les créations supprimées depuis vos projets apparaissent ici, restaurables à tout moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ProjectCard key={item.id} item={item} variant="trash" onRemoveFromTrash={handleRemove} />
      ))}
    </div>
  );
}
