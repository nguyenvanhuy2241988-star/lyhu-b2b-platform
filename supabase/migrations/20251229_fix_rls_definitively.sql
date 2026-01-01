-- Definitive RLS Fix for Chat Realtime
-- Reason: Previous policies were too restrictive or causing recursion/subquery failures,
-- preventing users from seeing messages from others.

-- 1. Reset Policies
drop policy if exists "Users can see their own participation" on internal_participants;
drop policy if exists "Users can join conversations" on internal_participants;
drop policy if exists "Authenticated can insert participants" on internal_participants;
drop policy if exists "Participants can view conversations" on internal_conversations;
drop policy if exists "Authenticated can create conversations" on internal_conversations;
drop policy if exists "Participants can update conversations" on internal_conversations;
drop policy if exists "Participants can select messages" on internal_messages;
drop policy if exists "Participants can insert messages" on internal_messages;
drop policy if exists "Users can update own messages" on internal_messages;
drop policy if exists "Users can delete own messages" on internal_messages;

-- 2. INTERNAL_PARTICIPANTS
-- Allow ALL authenticated users to SEE participant lists.
-- This effectively allows "Discovery" of who is in what chat, but solves the recursion/visibility bug.
create policy "Authenticated can view participants"
on internal_participants for select
using (auth.role() = 'authenticated');

-- Keep INSERT open for now (logic handled by ID matching in app)
create policy "Authenticated can insert participants"
on internal_participants for insert
with check (auth.role() = 'authenticated');

-- 3. INTERNAL_CONVERSATIONS
-- Allow ALL authenticated users to SEE conversations?
-- Ideally only if participant, but let's try the subquery again now that participants is readable.
create policy "Participants can view conversations"
on internal_conversations for select
using (
  auth.role() = 'authenticated' AND (
      is_public = true 
      OR 
      exists (
        select 1 from internal_participants p 
        where p.conversation_id = id 
        and p.user_id = auth.uid()
      )
  )
);

create policy "Authenticated can create conversations"
on internal_conversations for insert
with check (auth.role() = 'authenticated');

create policy "Participants can update conversations"
on internal_conversations for update
using (
  exists (
    select 1 from internal_participants p 
    where p.conversation_id = id 
    and p.user_id = auth.uid()
  )
);

-- 4. INTERNAL_MESSAGES
-- CRITICAL: RLS for Messages
create policy "Participants can select messages"
on internal_messages for select
using (
  exists (
    select 1 from internal_participants p 
    where p.conversation_id = conversation_id 
    and p.user_id = auth.uid()
  )
);

create policy "Participants can insert messages"
on internal_messages for insert
with check (
  exists (
    select 1 from internal_participants p 
    where p.conversation_id = conversation_id 
    and p.user_id = auth.uid()
  )
);

create policy "Users can update own messages"
on internal_messages for update
using (sender_id = auth.uid());

create policy "Users can delete own messages"
on internal_messages for delete
using (sender_id = auth.uid());

-- 5. Reload Config to ensure Realtime picks up changes immediately
NOTIFY pgrst, 'reload config';
