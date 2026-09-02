-- RYNVA — lets a user read their own activity_logs rows, for the new
-- /history page. Migration 0007 deliberately left this table with no
-- policies at all (admin-only, read via service role) — this adds exactly
-- one read policy, scoped to the caller's own rows, same shape as every
-- other "select own" policy in this project (generations, characters).
-- Writes still only ever happen via the service role (lib/activity/log.ts).
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: idempotent.

drop policy if exists "Users can view their own activity" on public.activity_logs;
create policy "Users can view their own activity"
  on public.activity_logs for select
  using (auth.uid() = user_id);
