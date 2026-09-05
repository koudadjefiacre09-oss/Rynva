-- RYNVA — referral tracking for the topbar "Invite friends" link
-- (?ref=<user-id> on /register). Makes that link actually do something:
-- signups through it get linked back to whoever shared it, surfaced as an
-- "Amis invités" count on /profile.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: idempotent.

alter table public.profiles
  add column if not exists referred_by uuid references auth.users(id) on delete set null;

create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by);

-- Extends the profile-creation trigger (migrations 0004/0006) to also copy
-- referred_by from signup metadata — validated here rather than trusted
-- from the client: a garbage or self-referential ref parameter is dropped
-- instead of being stored (or, worse, failing the FK constraint and
-- blocking the signup outright).
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

  insert into public.profiles (id, country, referred_by)
  values (new.id, new.raw_user_meta_data ->> 'country', ref_id)
  on conflict (id) do nothing;
  return new;
end;
$$;
