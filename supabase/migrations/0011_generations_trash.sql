-- RYNVA — soft delete for generations, backing the new "Corbeille" (trash)
-- view (see /trash, lib/generations/list.ts's listTrash()). Deleting a
-- generation now sets deleted_at instead of removing the row/file outright,
-- so it can be restored; permanently deleting (only offered from within the
-- trash) is a separate, explicit action.
--
-- No new RLS policy needed: the existing "own rows" select/update/delete
-- policies from migrations 0001/0005 already cover reading, restoring
-- (update deleted_at back to null) and permanently deleting.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: idempotent.

alter table public.generations
  add column if not exists deleted_at timestamptz;

create index if not exists generations_user_id_deleted_at_idx
  on public.generations (user_id, deleted_at);
