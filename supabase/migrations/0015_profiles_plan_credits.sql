-- RYNVA — restores profiles.plan and profiles.credits, which migration
-- 0004 declared but which never actually made it onto the live table (the
-- live schema drifted from the migrations folder at some point — the live
-- table has email/display_name columns no migration file adds, either).
--
-- This was silently worked around by hardcoding plan: "free" in
-- lib/profiles/get.ts, which is why upgradeToPro (app/(app)/premium/
-- actions.ts) writing plan/credits never showed up anywhere. Fixed
-- getProfile() to actually read `plan` in this session without checking
-- the live schema first — which broke the ENTIRE profile read in
-- production (PostgREST fails a select() outright if ANY requested column
-- doesn't exist), not just the plan field: avatar, admin badge, credits
-- used, the new free-trial counters all silently fell back to defaults.
-- This migration is the real fix — restoring the columns getProfile() (and
-- lib/credits/gate.ts, and premium/actions.ts) already assume exist.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run — URGENTLY, this fixes a live production regression. Safe to
-- re-run: idempotent.

alter table public.profiles
  add column if not exists credits integer not null default 100,
  add column if not exists plan text not null default 'free' check (plan in ('free', 'pro'));
