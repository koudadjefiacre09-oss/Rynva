import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

/**
 * Records one page view in `public.site_visits` (see app/api/track-visit/
 * route.ts, called from components/analytics/track-visit.tsx on every page
 * load). Service-role client, same reasoning as lib/activity/log.ts: the
 * table has no user-facing insert policy, and a client-controlled request
 * writing straight through the anon key would be an easy way to spam rows.
 *
 * Best-effort: any failure is swallowed so it never breaks the page that
 * triggered it — logged to the server console instead.
 */
export async function recordVisit(path: string, country: string | null) {
  if (!isAdminConfigured) return;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("site_visits").insert({
      path: path.slice(0, 200),
      country,
    });
    if (error) console.error("[recordVisit] insert failed:", error.message);
  } catch (err) {
    console.error("[recordVisit] failed:", err);
  }
}
