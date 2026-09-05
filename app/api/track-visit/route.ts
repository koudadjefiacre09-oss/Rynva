import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { recordVisit } from "@/lib/visits/record";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Fire-and-forget page-view beacon — called once per navigation by
 * components/analytics/track-visit.tsx. No auth required: this tracks
 * overall site traffic (marketing pages included), not just the
 * authenticated app, and carries nothing more identifying than the country
 * header Vercel already attaches to the request (see lib/geo.ts).
 *
 * Skips recording for: this browser having opted out (the "Ne pas compter
 * mes visites" toggle on /admin sets a cookie, see lib/visits/no-track.ts —
 * covers logged-out browsing too, not just the authenticated session), and
 * any signed-in admin, so the site's own team doesn't inflate its own
 * traffic numbers.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get("rynva_no_track")?.value === "1") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (profile?.is_admin) {
        return NextResponse.json({ ok: true, skipped: true });
      }
    }
  }

  const json = await request.json().catch(() => null);
  const path = typeof json?.path === "string" && json.path ? json.path : "/";

  const h = await headers();
  const country = h.get("x-vercel-ip-country");

  await recordVisit(path, country);
  return NextResponse.json({ ok: true });
}
