import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { detectImageFormat } from "@/lib/ai/retouch/formats";

/**
 * A user-provided image (animate, image reference) arrives as a data URL,
 * downscaled in the browser. Replicate is given a short-lived signed URL to a
 * copy in the user's private storage rather than a huge inline data URL.
 * Without Supabase (local dev) the data URL is passed through as-is.
 */
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["jpeg", "png", "webp"]);

export class SourceImageError extends Error {}

export async function resolveSourceImage(url: string, userId: string | null): Promise<string> {
  if (!url.startsWith("data:")) {
    if (!/^https:\/\//.test(url)) throw new SourceImageError("Adresse d'image invalide.");
    return url;
  }

  const match = /^data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)$/.exec(url);
  if (!match) throw new SourceImageError("Image invalide.");
  const bytes = Buffer.from(match[1], "base64");
  if (bytes.length > MAX_BYTES) throw new SourceImageError("Image trop volumineuse (8 Mo maximum).");
  const format = detectImageFormat(bytes.subarray(0, 64));
  if (!format || !ALLOWED.has(format.format)) {
    throw new SourceImageError("Format non pris en charge : utilisez une image JPEG, PNG ou WebP.");
  }

  if (!isSupabaseConfigured || !userId) return url;

  const ext = format.format === "jpeg" ? "jpg" : format.format;
  const path = `${userId}/uploads/${crypto.randomUUID()}.${ext}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from("generations").upload(path, bytes, { contentType: format.mime, upsert: false });
  if (error) {
    console.error("[source-image] upload failed:", error.message);
    throw new SourceImageError("Impossible d'enregistrer l'image importée. Réessayez.");
  }
  const { data, error: signError } = await supabase.storage.from("generations").createSignedUrl(path, 60 * 60);
  if (signError || !data) throw new SourceImageError("Impossible de préparer l'image importée.");
  return data.signedUrl;
}
