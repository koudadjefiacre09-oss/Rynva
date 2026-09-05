"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/app/(app)/profile/actions";
import { notifySuccess } from "@/lib/toast";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Sends the file to the uploadAvatar server action (service-role upload —
 * see app/(app)/profile/actions.ts for why this isn't a direct-to-Storage
 * browser upload). Click it again anytime to change the photo.
 */
export function AvatarUploader({
  name,
  initialAvatarUrl,
}: {
  name: string;
  initialAvatarUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Choisissez un fichier image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image trop volumineuse (5 Mo max).");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadAvatar(formData);
      if (result.error || !result.url) {
        setError(result.error ?? "Échec de l'envoi de l'image.");
        return;
      }

      setPreview(result.url);
      notifySuccess("Photo de profil mise à jour !");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="group relative h-16 w-16 shrink-0">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-lg font-semibold text-white">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(name)
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Changer la photo de profil"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-fit text-xs font-medium text-brand-purple hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Envoi..." : preview ? "Changer la photo" : "Ajouter une photo"}
        </button>
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <p className="text-xs text-zinc-500">JPG, PNG (5 Mo max)</p>
        )}
      </div>
    </div>
  );
}
