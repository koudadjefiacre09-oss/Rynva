"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CharacterWithUrl } from "@/lib/characters/list";

export function CharacterCard({
  character,
  onDeleted,
  onUpdated,
}: {
  character: CharacterWithUrl;
  onDeleted: (id: string) => void;
  onUpdated: (id: string, patch: { name: string; description: string | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(character.name);
  const [description, setDescription] = useState(character.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      onUpdated(character.id, { name: name.trim(), description: description.trim() || null });
      setEditing(false);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer "${character.name}" définitivement ?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/characters/${character.id}`, { method: "DELETE" });
      if (res.ok) onDeleted(character.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border">
      <div className="aspect-square w-full bg-surface-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={character.url} alt={character.name} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col gap-2 p-3.5">
        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="rounded border border-border bg-surface-secondary px-2.5 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:border-brand-purple"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Description (optionnel)"
              className="resize-none rounded border border-border bg-surface-secondary px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-brand-purple"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-1.5">
              <Button type="button" size="sm" loading={saving} onClick={handleSave}>
                <Check className="h-3.5 w-3.5" />
                Enregistrer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setName(character.name);
                  setDescription(character.description ?? "");
                  setError(null);
                }}
              >
                <X className="h-3.5 w-3.5" />
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-text-primary">{character.name}</p>
            {character.description && (
              <p className="line-clamp-2 text-xs text-text-muted">{character.description}</p>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-purple/50 hover:text-text-primary"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Supprimer"
                className="ml-auto flex items-center justify-center rounded-full border border-border p-1.5 text-text-muted transition-colors hover:border-danger/50 hover:text-danger disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
