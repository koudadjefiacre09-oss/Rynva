-- RYNVA — Characters library (reusable, consistent-face characters for
-- multi-character scene composition) + explicit delete support surfaced in
-- the UI (the `generations` delete policy already existed since migration
-- 0001, this just adds the equivalent table for characters).
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: every statement is idempotent.

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_user_id_created_at_idx
  on public.characters (user_id, created_at desc);

alter table public.characters enable row level security;

drop policy if exists "Users can view their own characters" on public.characters;
create policy "Users can view their own characters"
  on public.characters for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own characters" on public.characters;
create policy "Users can insert their own characters"
  on public.characters for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own characters" on public.characters;
create policy "Users can update their own characters"
  on public.characters for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own characters" on public.characters;
create policy "Users can delete their own characters"
  on public.characters for delete
  using (auth.uid() = user_id);

-- Characters use the same private "generations" storage bucket, under a
-- separate `characters/` prefix — extend the existing storage policies
-- (from migration 0001) to also allow that prefix.

drop policy if exists "Users can read their own generation files" on storage.objects;
create policy "Users can read their own generation files"
  on storage.objects for select
  using (
    bucket_id = 'generations'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or ((storage.foldername(name))[1] = 'characters' and (storage.foldername(name))[2] = auth.uid()::text)
    )
  );

drop policy if exists "Users can upload their own generation files" on storage.objects;
create policy "Users can upload their own generation files"
  on storage.objects for insert
  with check (
    bucket_id = 'generations'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or ((storage.foldername(name))[1] = 'characters' and (storage.foldername(name))[2] = auth.uid()::text)
    )
  );

drop policy if exists "Users can delete their own generation files" on storage.objects;
create policy "Users can delete their own generation files"
  on storage.objects for delete
  using (
    bucket_id = 'generations'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or ((storage.foldername(name))[1] = 'characters' and (storage.foldername(name))[2] = auth.uid()::text)
    )
  );
