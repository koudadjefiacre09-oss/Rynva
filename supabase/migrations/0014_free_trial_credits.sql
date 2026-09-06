-- RYNVA — free-trial image/video quotas: new signups get a capped, time-
-- limited allowance (20 images + 5 videos, 30 days) instead of unmetered
-- generation; the modal on first dashboard visit and the /api/ai/image and
-- /api/ai/video gates (see lib/credits/gate.ts) both read this.
--
-- credits_expire_at is nullable ON PURPOSE: NULL means "unmetered" —
-- existing accounts (created before this migration) get NULL here and are
-- never blocked, so this doesn't retroactively cap anyone already using the
-- app. Only new signups going forward get a real expiry from the trigger.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: every statement is idempotent.

alter table public.profiles
  add column if not exists free_images_remaining integer not null default 20,
  add column if not exists free_videos_remaining integer not null default 5,
  add column if not exists credits_expire_at timestamptz,
  add column if not exists welcome_shown boolean not null default true;

-- Extends the profile-creation trigger (migrations 0004/0013): new signups
-- get a real 30-day window and welcome_shown = false (so the congrats modal
-- fires once on their first dashboard visit); the column defaults above
-- already cover existing rows (welcome_shown defaults true, so nothing
-- changes for accounts that already exist).
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_id uuid;
begin
  begin
    ref_id := (new.raw_user_meta_data ->> 'referred_by')::uuid;
  exception when others then
    ref_id := null;
  end;

  if ref_id is not null then
    if ref_id = new.id or not exists (select 1 from auth.users where id = ref_id) then
      ref_id := null;
    end if;
  end if;

  insert into public.profiles (id, country, referred_by, credits_expire_at, welcome_shown)
  values (new.id, new.raw_user_meta_data ->> 'country', ref_id, now() + interval '30 days', false)
  on conflict (id) do nothing;
  return new;
end;
$$;
