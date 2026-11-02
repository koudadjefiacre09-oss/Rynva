"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { deleteUserFiles } from "@/lib/account/data.server";
import { DELETE_CONFIRMATION } from "@/lib/account/constants";

/**
 * RGPD right to erasure: deletes the signed-in user's files, then the auth
 * account. Every table row goes with it (all user tables reference
 * auth.users with ON DELETE CASCADE). Irreversible: guarded by typing
 * DELETE_CONFIRMATION.
 */
export async function deleteAccount(_prev: { error?: string } | null, formData: FormData): Promise<{ error?: string }> {
  if (String(formData.get("confirmation") ?? "").trim() !== DELETE_CONFIRMATION) {
    return { error: `Tapez ${DELETE_CONFIRMATION} pour confirmer.` };
  }
  if (!isAdminConfigured) {
    return { error: "Suppression indisponible pour le moment. Écrivez-nous à hello@rynva.app." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée : reconnectez-vous." };

  const admin = createAdminClient();
  try {
    await deleteUserFiles(admin, user.id);
  } catch (err) {
    console.error("[deleteAccount] files:", err);
    return { error: "La suppression de vos fichiers a échoué. Réessayez ou écrivez-nous à hello@rynva.app." };
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[deleteAccount] auth:", error.message);
    return { error: "La suppression du compte a échoué. Réessayez ou écrivez-nous à hello@rynva.app." };
  }

  await supabase.auth.signOut();
  redirect("/?compte=supprime");
}
