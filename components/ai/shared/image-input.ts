"use client";

/**
 * Reads an image file chosen in the browser and returns a JPEG data URL
 * downscaled to `maxEdge`, small enough for a request body. Only formats the
 * browser can decode (JPEG, PNG, WebP, GIF, AVIF, BMP) are supported here.
 */
export async function fileToDataUrl(file: File, maxEdge = 1920, quality = 0.9): Promise<string> {
  if (!file.type.startsWith("image/") || /heic|heif|tiff/.test(file.type)) {
    throw new Error("Format non pris en charge ici : utilisez une image JPEG, PNG ou WebP.");
  }
  if (file.size > 25 * 1024 * 1024) throw new Error("Image trop volumineuse (25 Mo maximum).");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Impossible de lire cette image.");
  });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de préparer l'image.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export interface ProjectImage {
  id: string;
  url: string;
  prompt: string | null;
}

export async function fetchProjectImages(): Promise<ProjectImage[]> {
  const res = await fetch("/api/generations", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { items: ProjectImage[] };
  return data.items;
}

/** Loads a remote image (signed URL of a creation) as a File. */
export async function urlToFile(url: string, baseName = "creation"): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Impossible de charger cette image (lien expiré ?).");
  const blob = await res.blob();
  const ext = ({ "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" } as Record<string, string>)[blob.type] ?? "png";
  return new File([blob], `${baseName}.${ext}`, { type: blob.type || "image/png" });
}
