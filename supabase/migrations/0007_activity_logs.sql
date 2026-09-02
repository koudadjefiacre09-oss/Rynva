-- RYNVA — activity_logs: the real table backing /admin's activity feed,
-- replacing the never-actually-applied `activity_log` from migration 0006
-- (that name/schema was superseded before it was ever created live). This
-- migration documents the schema that already exists in production so fresh
-- environments get the same table — every statement is idempotent, safe to
-- re-run.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run.

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  status text not null,
  tokens_used integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_id_created_at_idx
  on public.activity_logs (user_id, created_at desc);

alter table public.activity_logs enable row level security;

-- No policies: this table is written and read exclusively through the
-- service-role client (see lib/activity/log.ts and app/(app)/admin/page.tsx)
-- — regular users can neither see nor forge each other's activity.
