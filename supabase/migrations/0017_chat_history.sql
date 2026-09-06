-- RYNVA — chat conversation history: the AI Chat tool was entirely
-- stateless (the client held the whole message array in memory, nothing
-- persisted, gone on refresh). This gives it a real conversation list, like
-- every other chat product — a title auto-derived from the first message,
-- and every message saved.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- then Run. Safe to re-run: every statement is idempotent.

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nouvelle conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_conversations_user_id_updated_at_idx
  on public.chat_conversations (user_id, updated_at desc);

alter table public.chat_conversations enable row level security;

drop policy if exists "Users can view their own conversations" on public.chat_conversations;
create policy "Users can view their own conversations"
  on public.chat_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own conversations" on public.chat_conversations;
create policy "Users can create their own conversations"
  on public.chat_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own conversations" on public.chat_conversations;
create policy "Users can update their own conversations"
  on public.chat_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own conversations" on public.chat_conversations;
create policy "Users can delete their own conversations"
  on public.chat_conversations for delete
  using (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_id_created_at_idx
  on public.chat_messages (conversation_id, created_at);

alter table public.chat_messages enable row level security;

-- Redundant user_id (rather than joining through chat_conversations) keeps
-- the RLS check a single indexed column comparison, same pattern as
-- generations/activity_logs elsewhere in this schema.
drop policy if exists "Users can view their own messages" on public.chat_messages;
create policy "Users can view their own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own messages" on public.chat_messages;
create policy "Users can insert their own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);
