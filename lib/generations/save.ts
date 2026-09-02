import { createClient } from "@/lib/supabase/server";
import type { GenerationType } from "@/lib/generations/types";

const EXTENSION_BY_TYPE: Record<GenerationType, string> = {
  image: "png",
  design: "png",
  "photo-bg-remove": "png",
  "photo-enhance": "png",
  scene: "png",
  video: "mp4",
  audio: "mp3",
};

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

interface SaveGenerationInput {
  userId: string;
  type: GenerationType;
  sourceUrl: string;
  prompt?: string;
  metadata?: Record<string, unknown>;
  sourceGenerationId?: string;
}

/**
 * Downloads a (usually ephemeral — Replicate URLs expire) generation result
 * and persists it to the user's private Storage folder + a `generations` row,
 * then returns a signed URL to display it immediately.
 *
 * Returns null on any failure — callers fall back to the original ephemeral
 * URL so a storage hiccup never breaks the generation itself, it just means
 * that particular result won't show up in the gallery.
 */
export async function saveGeneration(
  input: SaveGenerationInput
): Promise<{ url: string; id: string } | null> {
  try {
    const sourceRes = await fetch(input.sourceUrl);
    if (!sourceRes.ok) return null;
    const bytes = await sourceRes.arrayBuffer();

    const extension = EXTENSION_BY_TYPE[input.type];
    const id = crypto.randomUUID();
    const path = `${input.userId}/${id}.${extension}`;

    const supabase = await createClient();

    const { error: uploadError } = await supabase.storage
      .from("generations")
      .upload(path, bytes, {
        contentType: CONTENT_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      console.error("[saveGeneration] upload failed:", uploadError.message);
      return null;
    }

    const { error: insertError } = await supabase.from("generations").insert({
      id,
      user_id: input.userId,
      type: input.type,
      prompt: input.prompt ?? null,
      storage_path: path,
      source_generation_id: input.sourceGenerationId ?? null,
      metadata: input.metadata ?? {},
    });
    if (insertError) {
      console.error("[saveGeneration] insert failed:", insertError.message);
      return null;
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("generations")
      .createSignedUrl(path, 60 * 60, { download: true });
    if (signError || !signed) {
      console.error("[saveGeneration] sign failed:", signError?.message);
      return null;
    }

    return { url: signed.signedUrl, id };
  } catch (err) {
    console.error("[saveGeneration] unexpected error:", err);
    return null;
  }
}
