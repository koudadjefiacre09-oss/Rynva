-- RYNVA — site_visits: one row per page load (anonymous or signed-in),
-- backing the "Trafic du site" section on /admin (visits per day, by
-- country). No user identification beyond the country header Vercel
-- already sets on every request (see lib/geo.ts) — same privacy stance as
-- profiles.country.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: idempotent.

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  country text,
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_at_idx
  on public.site_visits (created_at desc);

alter table public.site_visits enable row level security;

-- No policies: written and read exclusively through the service-role client
-- (see lib/visits/record.ts and app/(app)/admin/page.tsx) — same pattern as
-- activity_logs (migration 0007).
