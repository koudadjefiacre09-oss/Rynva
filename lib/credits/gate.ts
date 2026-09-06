import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

export type CreditKind = "image" | "video";

/** Shown on /dashboard and /profile — keep in sync with migration 0014's column defaults. */
export const FREE_IMAGE_QUOTA = 20;
export const FREE_VIDEO_QUOTA = 5;
export const FREE_TRIAL_DAYS = 30;

const NOUN: Record<CreditKind, string> = { image: "images", video: "vidéos" };
const REMAINING_COLUMN: Record<CreditKind, "free_images_remaining" | "free_videos_remaining"> = {
  image: "free_images_remaining",
  video: "free_videos_remaining",
};

export interface CreditCheckResult {
  allowed: boolean;
  /** French message to show the user when `allowed` is false. */
  reason?: string;
}

/**
 * Free-trial quota gate for image/video generation (see migration 0014's
 * free_images_remaining/free_videos_remaining/credits_expire_at columns).
 * Call this BEFORE hitting the AI provider in /api/ai/image and
 * /api/ai/video, so a blocked request never costs a provider call.
 *
 * credits_expire_at = null means "unmetered" (Pro plan, or an account that
 * predates this feature) — always allowed. Other generation types (design,
 * audio, scene, photo tools, chat) aren't gated here; only image/video were
 * asked to be capped.
 */
export async function checkCreditQuota(userId: string, kind: CreditKind): Promise<CreditCheckResult> {
  if (!isAdminConfigured) return { allowed: true };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan, free_images_remaining, free_videos_remaining, credits_expire_at")
    .eq("id", userId)
    .single();

  // Fail open — a missing row or read error should never block a generation.
  if (!profile) return { allowed: true };
  if (profile.plan === "pro") return { allowed: true };
  if (!profile.credits_expire_at) return { allowed: true };

  if (new Date(profile.credits_expire_at) < new Date()) {
    return {
      allowed: false,
      reason: "Votre période d'essai gratuite est terminée. Passez à RYNVA Pro pour continuer à générer.",
    };
  }

  const remaining =
    kind === "image" ? profile.free_images_remaining : profile.free_videos_remaining;
  if ((remaining ?? 0) <= 0) {
    return {
      allowed: false,
      reason: `Vous avez utilisé toutes vos ${NOUN[kind]} gratuites. Passez à RYNVA Pro pour continuer.`,
    };
  }

  return { allowed: true };
}

/**
 * Decrements the matching free-trial counter by one. Call once, after a
 * generation actually succeeds (same success-only timing as
 * lib/activity/log.ts's tokens_consumed). Best-effort: a failure here should
 * never break the generation response, so it only logs.
 */
export async function consumeCredit(userId: string, kind: CreditKind) {
  if (!isAdminConfigured) return;

  try {
    const admin = createAdminClient();
    const column = REMAINING_COLUMN[kind];
    const { data: profile, error: fetchError } = await admin
      .from("profiles")
      .select(column)
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      console.error("[consumeCredit] couldn't read remaining count:", fetchError?.message);
      return;
    }

    const current = (profile as Record<string, number | null>)[column] ?? 0;
    const { error: updateError } = await admin
      .from("profiles")
      .update({ [column]: Math.max(0, current - 1) })
      .eq("id", userId);
    if (updateError) {
      console.error("[consumeCredit] couldn't update remaining count:", updateError.message);
    }
  } catch (err) {
    console.error("[consumeCredit] failed:", err);
  }
}
