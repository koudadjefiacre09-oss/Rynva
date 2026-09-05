import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export interface Profile {
  /** Real count from profiles.tokens_consumed (see lib/activity/log.ts) — every generation's flat cost, summed. */
  tokensConsumed: number;
  plan: Plan;
  isAdmin: boolean;
  avatarUrl: string | null;
}

// plan is still a static placeholder — see the note in getProfile() below.
const DEFAULT_PROFILE: Profile = { tokensConsumed: 0, plan: "free", isAdmin: false, avatarUrl: null };

/**
 * Reads the signed-in user's `public.profiles` row.
 *
 * NOTE: `credits`/`plan` no longer exist as a spendable balance on the live
 * table — the schema moved to a `tokens_consumed` counter (see
 * lib/activity/log.ts), which is what the topbar/profile "credits" UI now
 * reads for a real number instead of a fixed placeholder. `plan` is still
 * reported as a fixed default: app/(app)/premium/actions.ts writes it via
 * the service-role client (bypassing RLS), so it isn't reflected here yet —
 * separate from this fix.
 */
export async function getProfile(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin, avatar_url, tokens_consumed")
    .eq("id", userId)
    .single();

  if (!data) return DEFAULT_PROFILE;
  return {
    tokensConsumed: (data.tokens_consumed as number | null) ?? 0,
    plan: DEFAULT_PROFILE.plan,
    isAdmin: Boolean(data.is_admin),
    avatarUrl: (data.avatar_url as string | null) ?? null,
  };
}
