import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

/**
 * Counts how many accounts were created through this user's "Invite
 * friends" link (?ref=<user-id> on /register — see components/layout/
 * topbar.tsx and the signup trigger in supabase/migrations/0013_referrals.sql).
 *
 * Service-role client: `profiles` RLS only lets a user read their own row,
 * not rows where referred_by matches them, and a policy broad enough to
 * allow that would expose the referred users' other profile columns too —
 * simpler and safer to read this one count with the admin client, same
 * reasoning as lib/activity/log.ts.
 */
export async function getInvitedCount(userId: string): Promise<number> {
  if (!isAdminConfigured) return 0;

  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", userId);

  if (error) {
    console.error("[getInvitedCount] failed:", error.message);
    return 0;
  }
  return count ?? 0;
}
