import { createClient } from "@/lib/supabase/server";

interface CreateCharacterInput {
  userId: string;
  name: string;
  description?: string;
  /** URL of the reference image (a Replicate output, or an uploaded data: URL). */
  imageUrl: string;
}

/**
 * Persists a new character: downloads its reference image into the user's
 * private Storage folder (same "generations" bucket, under characters/) and
 * inserts the row. Returns null on any failure.
 */
export async function createCharacter(
  input: CreateCharacterInput
): Promise<{ id: string; url: string } | null> {
  try {
    let bytes: ArrayBuffer | Buffer;
    let contentType = "image/png";

    if (input.imageUrl.startsWith("data:")) {
      const [header, base64] = input.imageUrl.split(",");
      contentType = header.match(/data:(.*);base64/)?.[1] ?? "image/png";
      bytes = Buffer.from(base64, "base64");
    } else {
      const res = await fetch(input.imageUrl);
      if (!res.ok) return null;
      bytes = await res.arrayBuffer();
    }

    const id = crypto.randomUUID();
    const extension = contentType.split("/")[1]?.split("+")[0] || "png";
    const path = `characters/${input.userId}/${id}.${extension}`;

    const supabase = await createClient();

    const { error: uploadError } = await supabase.storage
      .from("generations")
      .upload(path, bytes, { contentType, upsert: false });
    if (uploadError) {
      console.error("[createCharacter] upload failed:", uploadError.message);
      return null;
    }

    const { error: insertError } = await supabase.from("characters").insert({
      id,
      user_id: input.userId,
      name: input.name,
      description: input.description ?? null,
      storage_path: path,
    });
    if (insertError) {
      console.error("[createCharacter] insert failed:", insertError.message);
      return null;
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("generations")
      .createSignedUrl(path, 60 * 60, { download: true });
    if (signError || !signed) return null;

    return { id, url: signed.signedUrl };
  } catch (err) {
    console.error("[createCharacter] unexpected error:", err);
    return null;
  }
}
