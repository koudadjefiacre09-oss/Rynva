"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActionResult = { error?: string };

// Every bucket that stores files under a `<user_id>/...` prefix (see
// lib/generations/save.ts and app/(app)/profile/actions.ts's uploadAvatar).
const STORAGE_BUCKETS = ["generations", "avatars"];

// Every table with a user_id (or, for profiles, id) column pointing at
// auth.users. These are all declared "on delete cascade" in their migration
// files, but that turned out not to be reliable in practice — deleting a
// user with rows in `notifications` (and separately, a `profiles` row)
// failed with a generic "Database error deleting user" until those were
// removed manually first. Rather than track down which cascade is actually
// broken, deleteUserAdmin below clears all of these itself before calling
// the Auth API, instead of trusting the DB to do it.
const USER_SCOPED_TABLES = [
  { table: "generations", column: "user_id" },
  { table: "characters", column: "user_id" },
  { table: "activity_logs", column: "user_id" },
  { table: "activity_log", column: "user_id" }, // legacy table, superseded by activity_logs (migration 0007) but may still hold old rows
  { table: "notifications", column: "user_id" },
] as const;

/**
 * Empties a user's `<user_id>/` folder in every storage bucket. Storage
 * objects live outside the public schema entirely, so no `on delete cascade`
 * on a public table would ever reach them anyway.
 */
async function deleteUserStorage(supabaseAdmin: ReturnType<typeof createAdminClient>, userId: string) {
  for (const bucket of STORAGE_BUCKETS) {
    const { data: files, error: listError } = await supabaseAdmin.storage.from(bucket).list(userId);
    if (listError || !files?.length) continue;
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabaseAdmin.storage.from(bucket).remove(paths);
  }
}

export async function deleteUserAdmin(userId: string): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  try {
    const supabaseAdmin = createAdminClient();

    await deleteUserStorage(supabaseAdmin, userId);
    for (const { table, column } of USER_SCOPED_TABLES) {
      await supabaseAdmin.from(table).delete().eq(column, userId);
    }
    // Anyone this user referred keeps their account; just drop the dangling reference.
    await supabaseAdmin.from("profiles").update({ referred_by: null }).eq("referred_by", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

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
