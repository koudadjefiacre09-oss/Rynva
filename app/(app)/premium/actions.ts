"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

export type UpgradeResult = { error?: string; newCredits?: number };

const PRO_CREDITS_BONUS = 1000;

/**
 * Simulated payment success handler — no real charge happens (no payment
 * provider is wired: STRIPE_SECRET_KEY is empty in .env.local). Grants the
 * Pro credit bonus to the CURRENT session's own account only; the amount is
 * hardcoded here, never taken from the client.
 *
 * Uses the service-role client on purpose: profiles intentionally has no
 * user-facing UPDATE policy (see migration 0004) — a user's own client
 * can't write to it at all, which is exactly what stops anyone from
 * self-granting unlimited credits by calling an endpoint repeatedly. This
 * server action is the one deliberate exception, and it's safe only because
 * the amount and target row are fixed server-side, not client-supplied.
 */
export async function upgradeToPro(): Promise<UpgradeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour souscrire." };

  if (!isAdminConfigured) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local, nécessaire pour créditer le compte en toute sécurité.",
    };
  }

  const admin = createAdminClient();

  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();
  if (fetchError || !profile) {
    return { error: "Profil introuvable. La migration 0004 a-t-elle été exécutée ?" };
  }

  const newCredits = (profile.credits ?? 0) + PRO_CREDITS_BONUS;

  const { error: updateError } = await admin
    .from("profiles")
    .update({ credits: newCredits, plan: "pro" })
    .eq("id", user.id);
  if (updateError) return { error: updateError.message };

  // The new plan/credits show up in the Topbar badge, profile page, etc.
  revalidatePath("/", "layout");
  return { newCredits };
}
