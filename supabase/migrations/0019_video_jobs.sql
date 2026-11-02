-- RYNVA — adds public.video_jobs: one row per started video generation, so a
-- video is saved to the user's gallery (and its credit consumed exactly once)
-- even when the tab that started it was closed. Before this, finishing a job
-- depended on the browser polling until the end (5-7+ minutes): closing the
-- tab lost a video Replicate had already produced and billed.
--
-- Rows are written by the service-role client only (lib/ai/video-jobs.server.ts),
-- from the polling route, the Replicate webhook and the "jobs" endpoint.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: idempotent.

create table if not exists public.video_jobs (
  -- Replicate prediction id.
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text,
  metadata jsonb not null default '{}'::jsonb,
  source_generation_id uuid references public.generations(id) on delete set null,
  status text not null default 'processing'
    check (status in ('processing', 'finalizing', 'succeeded', 'failed')),
  generation_id uuid references public.generations(id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists video_jobs_user_id_status_idx
  on public.video_jobs (user_id, status, created_at desc);

alter table public.video_jobs enable row level security;

drop policy if exists "Users can view their own video jobs" on public.video_jobs;
create policy "Users can view their own video jobs"
  on public.video_jobs for select
  using (auth.uid() = user_id);
