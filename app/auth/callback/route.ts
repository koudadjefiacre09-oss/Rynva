import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Handles both the OAuth (Google) PKCE redirect and email links
 * (confirmation, password recovery) — all of them land here with a `code`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");

  if (isSupabaseConfigured && code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const hasName = Boolean(data.user?.user_metadata?.full_name);
      const target = explicitNext && explicitNext.startsWith("/") ? explicitNext : hasName ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
