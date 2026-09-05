import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Handles every kind of auth redirect landing back in the app:
 * - `code` — the OAuth (Google) PKCE redirect, exchanged via exchangeCodeForSession.
 * - `token_hash` + `type` — email links (confirm signup, password recovery,
 *   email change), verified via verifyOtp. Supabase's own default email
 *   templates use `{{ .ConfirmationURL }}`, which resolves to just the
 *   project's Site URL with a bare `code` query param — no path, so it
 *   never actually reaches this route. The templates (Authentication ->
 *   Emails -> Templates in the Supabase dashboard) must be edited to link
 *   here explicitly with `{{ .TokenHash }}` — see the redirect-to-login
 *   fallback below for what happens if that's still misconfigured.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const explicitNext = searchParams.get("next");

  if (isSupabaseConfigured) {
    const supabase = await createClient();

    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        : null;

    if (result && !result.error) {
      const hasName = Boolean(result.data.user?.user_metadata?.full_name);
      const target =
        explicitNext && explicitNext.startsWith("/") ? explicitNext : hasName ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
