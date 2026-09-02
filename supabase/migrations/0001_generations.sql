-- RYNVA — Phase 3 foundation: persisted generations (gallery / "Projets récents").
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: every statement is idempotent.

-- 1. Table -------------------------------------------------------------

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in ('image', 'video', 'design', 'audio', 'photo-bg-remove', 'photo-enhance')
  ),
  prompt text,
  storage_path text not null,
  source_generation_id uuid references public.generations(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);

alter table public.generations enable row level security;

drop policy if exists "Users can view their own generations" on public.generations;
create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own generations" on public.generations;
create policy "Users can insert their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own generations" on public.generations;
create policy "Users can delete their own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

-- 2. Storage bucket ------------------------------------------------------
-- Private bucket: files are only ever served through short-lived signed URLs
-- generated server-side for the owning user (see lib/generations/save.ts).

insert into storage.buckets (id, name, public)
values ('generations', 'generations', false)
on conflict (id) do nothing;

drop policy if exists "Users can read their own generation files" on storage.objects;
create policy "Users can read their own generation files"
  on storage.objects for select
  using (bucket_id = 'generations' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload their own generation files" on storage.objects;
create policy "Users can upload their own generation files"
  on storage.objects for insert
  with check (bucket_id = 'generations' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own generation files" on storage.objects;
create policy "Users can delete their own generation files"
  on storage.objects for delete
  using (bucket_id = 'generations' and (storage.foldername(name))[1] = auth.uid()::text);
