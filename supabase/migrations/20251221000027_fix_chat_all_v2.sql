-- COMPREHENSIVE FIX FOR CHAT CHANNELS
-- Run this entire script in Supabase SQL Editor

BEGIN;

-- 1. SCHEMA: Update Type Constraint & Add Column
alter table public.internal_conversations drop constraint if exists internal_conversations_type_check;
alter table public.internal_conversations add constraint internal_conversations_type_check check (type in ('direct', 'group', 'channel'));

alter table public.internal_conversations add column if not exists is_public boolean default false;

-- 2. DATA: Insert Channels (Idempotent)
insert into public.internal_conversations (type, name, is_public, last_message, last_message_at)
select 'channel', 'general', true, 'Welcome to General Channel!', now()
where not exists (select 1 from public.internal_conversations where name = 'general' and type = 'channel');

insert into public.internal_conversations (type, name, is_public, last_message, last_message_at)
select 'channel', 'thông-báo', true, 'Official Announcements', now()
where not exists (select 1 from public.internal_conversations where name = 'thông-báo' and type = 'channel');

insert into public.internal_conversations (type, name, is_public, last_message, last_message_at)
select 'channel', 'tán-gẫu', true, 'Random chat', now()
where not exists (select 1 from public.internal_conversations where name = 'tán-gẫu' and type = 'channel');

-- 3. RLS: Fix Visibility Policies
-- Allow viewing conversations if public OR participant
drop policy if exists "Users can view conversations they are in" on public.internal_conversations;
drop policy if exists "Users can view conversations" on public.internal_conversations;

create policy "Users can view conversations"
    on public.internal_conversations for select
    using (
        is_public = true or
        exists (
            select 1 from public.internal_participants
            where conversation_id = internal_conversations.id
            and user_id = auth.uid()
        )
    );

-- Allow viewing messages if in public conversation OR participant
drop policy if exists "Users can view messages in their conversations" on public.internal_messages;
drop policy if exists "Users can view messages" on public.internal_messages;

create policy "Users can view messages"
    on public.internal_messages for select
    using (
        exists (
            select 1 from public.internal_conversations
            where id = internal_messages.conversation_id
            and is_public = true
        )
        or
        exists (
            select 1 from public.internal_participants
            where conversation_id = internal_messages.conversation_id
            and user_id = auth.uid()
        )
    );

-- 4. BONUS: Auto-join all users to public channels (just to be safe)
insert into public.internal_participants (conversation_id, user_id, joined_at)
select c.id, u.id, now()
from public.internal_conversations c
cross join auth.users u
where c.type = 'channel' and c.is_public = true
on conflict (conversation_id, user_id) do nothing;

COMMIT;
