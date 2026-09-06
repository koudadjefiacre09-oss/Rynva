"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

/**
 * Marks the free-trial "Félicitations" welcome modal (see
 * components/dashboard/welcome-credits-modal.tsx) as shown, so it never
 * reappears for this account. Uses the service-role client on purpose:
 * `profiles` has no user-facing UPDATE policy (see migration 0004) — same
 * reason as lib/activity/log.ts and app/(app)/premium/actions.ts.
 */
export async function markWelcomeShown() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminConfigured) return;

  const admin = createAdminClient();
  await admin.from("profiles").update({ welcome_shown: true }).eq("id", user.id);
}
