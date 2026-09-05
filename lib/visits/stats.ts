import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

export interface DailyVisitCount {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export interface CountryVisitCount {
  country: string;
  count: number;
}

export interface VisitStats {
  /** Last `days` days, oldest first, zero-filled (a quiet day is a zero, not a gap). */
  byDay: DailyVisitCount[];
  /** Top countries over the same 30-day window, most visits first. */
  byCountry: CountryVisitCount[];
  today: number;
  last7Days: number;
  last30Days: number;
}

const EMPTY_STATS: VisitStats = { byDay: [], byCountry: [], today: 0, last7Days: 0, last30Days: 0 };

/**
 * Reads and aggregates `public.site_visits` for the admin "Trafic du site"
 * section. Pulls 30 days of raw rows and aggregates in JS rather than a
 * SQL group-by — PostgREST (Supabase's REST layer) doesn't expose date_trunc
 * grouping, and at this app's scale 30 days of visit rows is nothing to
 * fetch and reduce here.
 */
export async function getVisitStats(days = 14): Promise<VisitStats> {
  if (!isAdminConfigured) return EMPTY_STATS;

  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  since.setHours(0, 0, 0, 0);

  const { data: rows, error } = await admin
    .from("site_visits")
    .select("created_at, country")
    .gte("created_at", since.toISOString());

  if (error || !rows) return EMPTY_STATS;

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dayCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  let today = 0;
  let last7Days = 0;

  for (const row of rows) {
    const createdAt = new Date(row.created_at as string);
    const dayKey = createdAt.toISOString().slice(0, 10);
    dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + 1);

    const country = (row.country as string | null) ?? "Inconnu";
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);

    if (dayKey === todayKey) today++;
    if (createdAt >= sevenDaysAgo) last7Days++;
  }

  const byDay: DailyVisitCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.push({ date: key, count: dayCounts.get(key) ?? 0 });
  }

  const byCountry: CountryVisitCount[] = Array.from(countryCounts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return { byDay, byCountry, today, last7Days, last30Days: rows.length };
}
