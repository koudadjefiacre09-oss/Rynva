"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Marks one notification as read. Runs as the caller's own session (not the
 * service-role client) — the "update own" RLS policy from
 * supabase/migrations/0010_notifications.sql is what actually scopes this to
 * the caller's own rows, so a mismatched id from another account just
 * silently updates zero rows.
 */
export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
}

/** Marks every one of the caller's unread notifications as read. */
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
}
