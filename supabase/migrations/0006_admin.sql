-- RYNVA — admin space: an `is_admin` flag + a best-effort `country` on
-- profiles, and an activity_log table the /api/ai/* routes write to (one row
-- per generation attempt, success or failure) so /admin has something real
-- to show instead of invented numbers.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: every statement is idempotent.

-- 1. profiles additions --------------------------------------------------

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.profiles
  add column if not exists country text;

-- Make the first account an admin so there's a way in. Run this manually
-- once, for your own account, from the SQL Editor:
--   update public.profiles set is_admin = true where id = '<your-user-id>';

-- 2. activity_log ---------------------------------------------------------
-- One row per generation attempt (image/video/design/audio/photo/scene/chat),
-- success or failure. `cost` is a flat, hardcoded estimate per action type
-- (see lib/activity/log.ts) — no AI provider used here returns real token/
-- compute usage in a uniform way, so this is NOT billed usage, just a
-- consistent relative signal for the admin table.

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  status text not null check (status in ('success', 'error')),
  cost integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_user_id_created_at_idx
  on public.activity_log (user_id, created_at desc);

alter table public.activity_log enable row level security;

-- Users can log their own activity (the API routes insert as the signed-in
-- user) but can't read anyone's log, including their own — this table is
-- for /admin only, which reads it with the service role key and bypasses
-- RLS entirely.
drop policy if exists "Users can insert their own activity" on public.activity_log;
create policy "Users can insert their own activity"
  on public.activity_log for insert
  with check (auth.uid() = user_id);

-- 3. capture country at signup, if the client sent one -------------------
-- supabase.auth.signUp({ options: { data: { country } } }) stashes it on
-- auth.users.raw_user_meta_data; the profile-creation trigger copies it over.

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, country)
  values (new.id, new.raw_user_meta_data ->> 'country')
  on conflict (id) do nothing;
  return new;
end;
$$;
