-- RYNVA — re-attaches the profile-creation trigger on auth.users, which had
-- stopped firing entirely (verified by creating disposable test accounts and
-- confirming zero rows landed in public.profiles for any of them — email,
-- Google, or admin-created, all the same). Root cause unclear (never
-- reproduced how it detached — possibly a Supabase Studio action, or one of
-- the SQL Editor runs for a previous migration silently not completing the
-- trigger statement), but the fix is the same regardless: recreate the
-- function and re-attach the trigger, both idempotent.
--
-- This one bug quietly broke several things at once, since the app never
-- crashes on a missing profiles row (every read falls back to safe
-- defaults) — it just meant new signups got NO row at all until some other
-- write path (e.g. uploadAvatar's upsert) incidentally created a bare one:
--   - referred_by never captured -> the "amis invités" counter (migration
--     0013) could never move, regardless of whether the invite link was
--     shared correctly.
--   - country never captured -> "Inconnu" in /admin for every recent user.
--   - credits_expire_at / welcome_shown never set for new signups -> the
--     free-trial welcome modal (migration 0014) never appeared, and new
--     accounts were accidentally unmetered (a null expiry reads as
--     "unlimited" in lib/credits/gate.ts) instead of getting the intended
--     20 images / 5 videos / 30 days.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: idempotent.

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

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Backfill: any pre-existing auth.users row still missing a profiles row
-- entirely (the exact symptom of this bug) gets one now, with the same
-- new-signup defaults the trigger would have given it.
insert into public.profiles (id, country, credits_expire_at, welcome_shown)
select id, raw_user_meta_data ->> 'country', now() + interval '30 days', false
from auth.users
on conflict (id) do nothing;
