import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export interface Profile {
  /** Real count from profiles.tokens_consumed (see lib/activity/log.ts) — every generation's flat cost, summed. */
  tokensConsumed: number;
  plan: Plan;
  isAdmin: boolean;
  avatarUrl: string | null;
  /** Free-trial quotas (migration 0014) — null credit fields below mean "unmetered": Pro plan, or an account that predates this feature. */
  imagesRemaining: number;
  videosRemaining: number;
  creditsExpireAt: string | null;
  /** Whether the "Félicitations" free-trial modal has already been shown/dismissed once. */
  welcomeShown: boolean;
}

const DEFAULT_PROFILE: Profile = {
  tokensConsumed: 0,
  plan: "free",
  isAdmin: false,
  avatarUrl: null,
  imagesRemaining: 0,
  videosRemaining: 0,
  creditsExpireAt: null,
  welcomeShown: true,
};

/**
 * Reads the signed-in user's `public.profiles` row.
 */
export async function getProfile(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "is_admin, avatar_url, tokens_consumed, plan, free_images_remaining, free_videos_remaining, credits_expire_at, welcome_shown"
    )
    .eq("id", userId)
    .single();

  if (!data) return DEFAULT_PROFILE;
  return {
    tokensConsumed: (data.tokens_consumed as number | null) ?? 0,
    plan: (data.plan as Plan | null) ?? "free",
    isAdmin: Boolean(data.is_admin),
    avatarUrl: (data.avatar_url as string | null) ?? null,
    imagesRemaining: (data.free_images_remaining as number | null) ?? 0,
    videosRemaining: (data.free_videos_remaining as number | null) ?? 0,
    creditsExpireAt: (data.credits_expire_at as string | null) ?? null,
    welcomeShown: (data.welcome_shown as boolean | null) ?? true,
  };
}
