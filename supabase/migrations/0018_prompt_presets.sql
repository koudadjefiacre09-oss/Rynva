-- RYNVA — saved prompt presets ("Bibliothèque de prompts" on /ai/image):
-- a short label + the prompt text, reusable across sessions. Real feature
-- (unlike the reference's model picker / negative prompt / reference-image
-- conditioning / credit packs, none of which RYNVA's image model supports).
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: idempotent.

create table if not exists public.prompt_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  prompt text not null,
  created_at timestamptz not null default now()
);

create index if not exists prompt_presets_user_id_created_at_idx
  on public.prompt_presets (user_id, created_at desc);

alter table public.prompt_presets enable row level security;

drop policy if exists "Users can view their own prompt presets" on public.prompt_presets;
create policy "Users can view their own prompt presets"
  on public.prompt_presets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own prompt presets" on public.prompt_presets;
create policy "Users can create their own prompt presets"
  on public.prompt_presets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own prompt presets" on public.prompt_presets;
create policy "Users can delete their own prompt presets"
  on public.prompt_presets for delete
  using (auth.uid() = user_id);
