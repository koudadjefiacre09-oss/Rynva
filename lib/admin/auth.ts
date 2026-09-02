import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Gate for every admin page/action: redirects non-admins away before any
 * privileged (service-role) code runs. Uses the normal per-request client —
 * a user can always read their own `profiles.is_admin` (see migration
 * 0001/0004 RLS), no service role needed just to check the flag.
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    // Surfaced in the `npm run dev` terminal, never sent to the client — the
    // previous version swallowed this, turning every failure mode (RLS
    // denial, missing column, no matching row, is_admin genuinely false)
    // into an identical silent redirect with no way to tell them apart.
    console.error("[requireAdmin] access denied — compare this to the row you edited in Supabase:", {
      sessionUserId: user.id,
      supabaseProjectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      profileFound: Boolean(profile),
      isAdmin: profile?.is_admin ?? null,
      queryErrorCode: error?.code ?? null,
      queryErrorMessage: error?.message ?? null,
    });
    redirect("/dashboard");
  }

  return user;
}
