-- RYNVA — favorites: a boolean flag on generations, toggled from the
-- gallery/dashboard star button, surfaced on /favorites.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: every statement is idempotent.

alter table public.generations
  add column if not exists is_favorite boolean not null default false;

create index if not exists generations_user_id_favorite_idx
  on public.generations (user_id, is_favorite)
  where is_favorite;

-- Migration 0001 never added an UPDATE policy (nothing was editable yet) —
-- needed now so a user can toggle the favorite flag on their own rows.
drop policy if exists "Users can update their own generations" on public.generations;
create policy "Users can update their own generations"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
