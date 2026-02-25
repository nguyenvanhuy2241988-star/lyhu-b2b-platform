-- FIX INFINITE RECURSION IN RLS
-- We must use a SECURITY DEFINER function to check membership without triggering RLS loops.

BEGIN;

-- 1. Create Helper Function (Bypasses RLS)
create or replace function public.is_internal_member(_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 
        from public.internal_participants 
        where conversation_id = _conversation_id 
        and user_id = auth.uid()
    );
$$;

-- 2. Update Conversations Policy
drop policy if exists "Users can view conversations" on public.internal_conversations;
drop policy if exists "Users can view conversations they are in" on public.internal_conversations;

create policy "Users can view conversations"
    on public.internal_conversations for select
    using (
        is_public = true 
        or public.is_internal_member(id)
    );

-- 3. Update Participants Policy
drop policy if exists "Users can view participants" on public.internal_participants;
drop policy if exists "Users can view participants of their conversations" on public.internal_participants;
-- Also drop any other likely named policies
drop policy if exists "Users can add participants" on public.internal_participants;

create policy "Users can view participants"
    on public.internal_participants for select
    using (
        -- I can see participants if I am a member of the conversation OR it's public
        public.is_internal_member(conversation_id)
        or exists (
            select 1 from public.internal_conversations 
            where id = conversation_id and is_public = true
        )
    );

create policy "Users can add participants"
    on public.internal_participants for insert
    with check (
        -- Simple rule: Can join public channels or if I am already a member (adding others)
        user_id = auth.uid() -- Self-join
        or public.is_internal_member(conversation_id) -- Adding others
    );

-- 4. Update Messages Policy
drop policy if exists "Users can view messages" on public.internal_messages;
drop policy if exists "Users can view messages in their conversations" on public.internal_messages;

create policy "Users can view messages"
    on public.internal_messages for select
    using (
        -- Visible if public channel OR member
        exists (
            select 1 from public.internal_conversations 
            where id = conversation_id and is_public = true
        )
        or public.is_internal_member(conversation_id)
    );

drop policy if exists "Users can send messages" on public.internal_messages;
create policy "Users can send messages"
    on public.internal_messages for insert
    with check (
        -- Must be member to send (even public channels? usually yes, auto-join handles this)
        public.is_internal_member(conversation_id)
    );

COMMIT;
