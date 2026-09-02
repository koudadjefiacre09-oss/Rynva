"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActionResult = { error?: string };

export async function deleteUserAdmin(userId: string): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  try {
    const supabaseAdmin = createAdminClient();
    // auth.users FK cascades (on delete cascade) clean up profiles,
    // generations, characters, activity_log for this user automatically.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inconnue." };
  }

  revalidatePath("/admin");
  return {};
}

export async function setUserSuspended(userId: string, suspend: boolean): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    return { error: "Vous ne pouvez pas suspendre votre propre compte." };
  }

  try {
    const supabaseAdmin = createAdminClient();
    // Supabase's real ban mechanism — "876000h" (~100 years) as an effectively
    // indefinite suspension, "none" to lift it. Not a fabricated flag.
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: suspend ? "876000h" : "none",
    });
    if (error) return { error: error.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inconnue." };
  }

  revalidatePath("/admin");
  return {};
}
