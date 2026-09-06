"use client";

import { useRef, useState } from "react";
import { Upload, Sparkles, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CharacterWithUrl } from "@/lib/characters/list";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function CreateCharacterForm({ onCreated }: { onCreated: (character: CharacterWithUrl) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"generate" | "upload">("generate");
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setPrompt("");
    setPreview(null);
    setName("");
    setDescription("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Choisissez un fichier image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image trop volumineuse (10 Mo max).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleGeneratePreview() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only one portrait is ever used here — the main Image tool's default
        // of 4 variations would be 4x the Replicate cost for 3 unused images.
        body: JSON.stringify({ prompt, aspectRatio: "1:1", variations: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setPreview(data.url);
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!preview || !name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: preview,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      onCreated({
        id: data.id,
        user_id: "",
        name: name.trim(),
        description: description.trim() || null,
        storage_path: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        url: data.url,
      });
      reset();
      setOpen(false);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-text-muted transition-colors hover:border-brand-purple/60 hover:text-text-secondary"
      >
        <Plus className="h-6 w-6" />
        <span className="text-sm font-medium">Nouveau personnage</span>
      </button>
    );
  }

  return (
    <Card className="sm:col-span-2 lg:col-span-3">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary">Nouveau personnage</h3>
          <button
            type="button"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            className="text-xs text-text-muted hover:text-text-secondary"
          >
            Annuler
          </button>
        </div>

        <div className="flex gap-2 rounded-lg border border-border bg-surface-secondary p-1">
          <button
            type="button"
            onClick={() => {
              setMode("generate");
              setPreview(null);
              setError(null);
            }}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "generate"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            Générer
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("upload");
              setPreview(null);
              setError(null);
            }}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "upload"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            Importer une photo
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            {mode === "generate" ? (
              <>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex : portrait d'une femme aux cheveux roux bouclés, veste en jean, style photo studio"
                  rows={3}
                  maxLength={2000}
                  className="w-full resize-none rounded border border-border bg-surface-secondary px-3.5 py-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-brand-purple"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  loading={generating}
                  onClick={handleGeneratePreview}
                >
                  <Sparkles className="h-4 w-4" />
                  Générer l&apos;image
                </Button>
              </>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded border border-dashed border-border bg-surface-secondary px-6 py-10 text-center transition-colors hover:border-brand-purple/60"
                >
                  <Upload className="h-5 w-5 text-text-muted" />
                  <span className="text-xs text-text-muted">Cliquez pour importer une photo</span>
                </button>
              </>
            )}

            <Input
              placeholder="Nom du personnage"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel), utile pour vous souvenir de son style"
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-brand-purple"
            />

            {error && (
              <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <Button
              type="button"
              loading={saving}
              disabled={!preview || !name.trim()}
              onClick={handleSave}
              className="self-start"
            >
              Enregistrer le personnage
            </Button>
          </div>

          <div className="flex aspect-square items-center justify-center overflow-hidden rounded border border-border bg-surface-secondary">
            {generating ? (
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">Génération en cours...</span>
              </div>
            ) : preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Aperçu du personnage" className="w-full object-contain" />
            ) : (
              <p className="p-6 text-center text-xs text-text-muted">L&apos;aperçu apparaîtra ici</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
