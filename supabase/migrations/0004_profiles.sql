-- RYNVA — user profiles: credits balance + plan, surfaced on /profile (and
-- eventually the topbar credit badge). The display name stays in
-- auth.users.user_metadata.full_name (already used by onboarding) — this
-- table only holds account data a user must never be able to grant
-- themselves, so it deliberately has NO insert/update/delete policy: writes
-- only ever happen server-side, via the trigger below (SECURITY DEFINER) or
-- future service-role code (Stripe webhooks, credit metering on generation).
-- Users can look but not touch.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: every statement is idempotent.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  credits integer not null default 100,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Auto-provision a profile row for every new signup.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Backfill: give every pre-existing user a profile row too.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
