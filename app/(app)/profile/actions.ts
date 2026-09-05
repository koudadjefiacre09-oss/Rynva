"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { NOTIFY } from "@/lib/notifications/create";

export type UploadAvatarResult = { error?: string; url?: string };

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

// Maps the browser-reported MIME type to a known-safe extension/content-type
// pair. Deliberately never derived from the original file *name* — some
// files (exported from Photos apps, WhatsApp, etc.) have no "." in their
// name at all, which made `file.name.split(".").pop()` fall back to the
// *whole* filename as the "extension". If that filename contained a
// character outside Latin-1 (e.g. "…" or "•"), it ended up in the storage
// path/content-type and broke the upload with "Cannot convert argument to a
// ByteString" — fetch headers are Latin-1-only. A MIME allow-list sidesteps
// that entirely.
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Uploads the avatar file server-side with the service-role client and
 * persists its public URL to profiles.avatar_url in one call.
 *
 * This replaced a direct-from-browser upload to Storage that kept failing
 * with "new row violates row-level security policy" on storage.objects,
 * even after the path was repeatedly confirmed correct
 * (`<user.id>/avatar.<ext>`) and the insert/update/delete policies were
 * re-created in the SQL Editor with the exact
 * `(storage.foldername(name))[1] = auth.uid()::text` condition — the error
 * was byte-for-byte identical before and after, which points at the fix not
 * actually taking effect in the database rather than anything in this app's
 * code. Using the service-role client here sidesteps that entirely: it's
 * safe because the path is always the *session's own* user id, never
 * anything the client can influence.
 */
export async function uploadAvatar(formData: FormData): Promise<UploadAvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour modifier votre photo de profil." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Aucun fichier reçu." };
  if (!file.type.startsWith("image/")) return { error: "Choisissez un fichier image." };
  if (file.size > MAX_FILE_BYTES) return { error: "Image trop volumineuse (5 Mo max)." };

  if (!isAdminConfigured) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local, nécessaire pour enregistrer la photo.",
    };
  }

  const contentType = file.type.toLowerCase();
  const extension = EXTENSION_BY_MIME[contentType];
  if (!extension) {
    return { error: "Format d'image non supporté (JPG, PNG, WebP ou GIF uniquement)." };
  }

  const admin = createAdminClient();
  const path = `${user.id}/avatar.${extension}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, bytes, { upsert: true, contentType });
  if (uploadError) {
    console.error("[uploadAvatar] storage upload failed:", uploadError.message);
    return { error: `Échec de l'envoi : ${uploadError.message}` };
  }

  const { data: publicUrlData } = admin.storage.from("avatars").getPublicUrl(path);

  // upsert, not update: a plain .update() silently affects zero rows (no
  // error) if this account somehow has no profiles row yet — upsert
  // self-heals that instead of the avatar quietly failing to save.
  const { error: updateError } = await admin
    .from("profiles")
    .upsert({ id: user.id, avatar_url: publicUrlData.publicUrl }, { onConflict: "id" });
  if (updateError) {
    console.error("[uploadAvatar] profiles upsert failed:", updateError.message);
    return { error: updateError.message };
  }

  revalidatePath("/", "layout");
  await NOTIFY.avatarUpdated(user.id);
  // Cache-bust: the path is stable across re-uploads (upsert), so the URL
  // alone wouldn't change and the browser/CDN could keep showing the old image.
  return { url: `${publicUrlData.publicUrl}?v=${Date.now()}` };
}
