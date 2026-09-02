import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export interface Profile {
  credits: number;
  plan: Plan;
  isAdmin: boolean;
  avatarUrl: string | null;
}

// credits/plan are static placeholders — see the note in getProfile() below.
const DEFAULT_PROFILE: Profile = { credits: 100, plan: "free", isAdmin: false, avatarUrl: null };

/**
 * Reads the signed-in user's `public.profiles` row.
 *
 * NOTE: `credits`/`plan` no longer exist on the live table — the schema
 * moved to a `tokens_consumed` counter (see lib/activity/log.ts) instead of
 * a spendable balance, but nothing has decided yet whether to restore
 * credits/plan or redesign the credit UI around tokens_consumed. Selecting
 * the old columns here would error the *entire* query and silently take
 * is_admin/avatar_url down with it, so for now this only reads what
 * actually exists and reports credits/plan as fixed defaults until that's
 * resolved.
 */
export async function getProfile(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin, avatar_url")
    .eq("id", userId)
    .single();

  if (!data) return DEFAULT_PROFILE;
  return {
    credits: DEFAULT_PROFILE.credits,
    plan: DEFAULT_PROFILE.plan,
    isAdmin: Boolean(data.is_admin),
    avatarUrl: (data.avatar_url as string | null) ?? null,
  };
}
