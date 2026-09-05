import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/lib/notifications/types";

/** Fetches a user's most recent notifications and their unread count. */
export async function listNotifications(
  userId: string,
  limit = 20
): Promise<{ notifications: NotificationRow[]; unreadCount: number }> {
  const supabase = await createClient();

  const [{ data: rows, error }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false),
  ]);

  if (error || !rows) return { notifications: [], unreadCount: 0 };
  return { notifications: rows, unreadCount: count ?? 0 };
}
