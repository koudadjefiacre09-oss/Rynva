import { createAdminClient } from "@/lib/supabase/admin";

export type ActivityAction =
  | "image"
  | "video"
  | "design"
  | "audio"
  | "photo-bg-remove"
  | "photo-enhance"
  | "scene"
  | "chat";

// Flat, hardcoded cost per action — NOT real provider token/compute usage.
// None of the AI providers wired in lib/ai/providers/* return a uniform
// token/cost figure (Replicate bills by hardware-seconds, Anthropic/OpenAI/
// Grok by tokens, none of it captured today), so this is a consistent
// relative weight for admin's "consumption" column, not billed usage.
const COST_BY_ACTION: Record<ActivityAction, number> = {
  image: 10,
  video: 25,
  design: 10,
  audio: 8,
  "photo-bg-remove": 5,
  "photo-enhance": 6,
  scene: 15,
  chat: 1,
};

const STATUS_LABEL = { success: "Réussi", error: "Échoué" } as const;

// Shared with /admin and /history so both render the same French labels.
export const ACTION_LABEL: Record<ActivityAction, string> = {
  image: "Génération Image",
  video: "Génération Vidéo",
  design: "Génération Design",
  audio: "Génération Audio",
  "photo-bg-remove": "Suppression fond photo",
  "photo-enhance": "Amélioration photo",
  scene: "Génération Scène",
  chat: "Message Chat",
};

/**
 * Records one generation attempt to `public.activity_logs` and, on success,
 * adds its cost to `profiles.tokens_consumed` — for the /admin activity feed.
 *
 * Uses the service-role client on purpose, for the same reason as
 * app/(app)/premium/actions.ts: `profiles` has no user-facing UPDATE policy
 * (nothing stops it being the same story for `activity_logs`, and there's no
 * way to check from here), so a per-request client would silently fail to
 * write either. The amount is always the fixed COST_BY_ACTION value, never
 * client-supplied, so a privileged write here can't be abused into
 * self-granting anything.
 *
 * Best-effort: any failure is swallowed so it never breaks the actual
 * generation request — logged to the server console instead.
 */
export async function logActivity(
  userId: string,
  action: ActivityAction,
  status: "success" | "error",
  metadata: Record<string, unknown> = {}
) {
  const tokensUsed = status === "success" ? COST_BY_ACTION[action] : 0;

  try {
    const admin = createAdminClient();

    const { error: insertError } = await admin.from("activity_logs").insert({
      user_id: userId,
      action_type: action,
      status: STATUS_LABEL[status],
      tokens_used: tokensUsed,
      error_message:
        status === "error" ? String(metadata.message ?? "Erreur inconnue.") : null,
    });
    if (insertError) {
      console.error("[logActivity] insert into activity_logs failed:", insertError.message);
    }

    if (status === "success" && tokensUsed > 0) {
      const { data: profile, error: fetchError } = await admin
        .from("profiles")
        .select("tokens_consumed")
        .eq("id", userId)
        .single();

      if (fetchError || !profile) {
        console.error("[logActivity] couldn't read tokens_consumed:", fetchError?.message);
      } else {
        const { error: updateError } = await admin
          .from("profiles")
          .update({ tokens_consumed: (profile.tokens_consumed ?? 0) + tokensUsed })
          .eq("id", userId);
        if (updateError) {
          console.error("[logActivity] couldn't update tokens_consumed:", updateError.message);
        }
      }
    }
  } catch (err) {
    console.error("[logActivity] failed:", err);
  }
}
