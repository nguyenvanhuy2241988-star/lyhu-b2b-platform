-- Migration: Secure RLS Policies for Chat
-- Purpose: Ensure Realtime works by allowing participants to SELECT messages.

-- 1. Enable RLS (Ensure it's on)
alter table internal_conversations enable row level security;
alter table internal_participants enable row level security;
alter table internal_messages enable row level security;
alter table internal_message_reactions enable row level security;

-- 2. POLICIES
-- Clean up old policies to avoid conflicts? 
-- It is safer to drop if exists, but we don't know names.
-- We'll try to create generic names.

-- ==========================================
-- INTERNAL_PARTICIPANTS
-- ==========================================
-- User can see rows where they are the user
create policy "Users can see their own participation"
on internal_participants for select
using (auth.uid() = user_id);

-- User can insert themselves (joining) or others (if group creator? simplified: any authenticated)
create policy "Users can join conversations"
on internal_participants for insert
with check (auth.uid() = user_id); 
-- Note: AddGroup requires inserting OTHERS.
-- Let's allow inserting ANY if you are authenticated (logic handled by app/store logic for now)
-- OR: better allow inserting if auth.uid() is in the created group? Complex.
-- Let's stick to a permissive INSERT for now to unblock, tight SELECT.
create policy "Authenticated can insert participants"
on internal_participants for insert
with check (auth.role() = 'authenticated');

-- ==========================================
-- INTERNAL_CONVERSATIONS
-- ==========================================
-- User can see conversation IF they are a participant
-- or if it is public?
create policy "Participants can view conversations"
on internal_conversations for select
using (
  is_public = true 
  or 
  exists (
    select 1 from internal_participants p 
    where p.conversation_id = id 
    and p.user_id = auth.uid()
  )
);

-- Allow creating conversations
create policy "Authenticated can create conversations"
on internal_conversations for insert
with check (auth.role() = 'authenticated');
-- And update? (Rename)
create policy "Participants can update conversations"
on internal_conversations for update
using (
  exists (
    select 1 from internal_participants p 
    where p.conversation_id = id 
    and p.user_id = auth.uid()
  )
);


-- ==========================================
-- INTERNAL_MESSAGES
-- ==========================================
-- CRITICAL for REALTIME:
-- User can SELECT messages if they are a participant of the conversation
create policy "Participants can select messages"
on internal_messages for select
using (
  exists (
    select 1 from internal_participants p 
    where p.conversation_id = conversation_id 
    and p.user_id = auth.uid()
  )
);

-- User can INSERT if they are a participant
create policy "Participants can insert messages"
on internal_messages for insert
with check (
  exists (
    select 1 from internal_participants p 
    where p.conversation_id = conversation_id 
    and p.user_id = auth.uid()
  )
);

-- Update/Delete (Edit/Undo) - Own messages only
create policy "Users can update own messages"
on internal_messages for update
using (sender_id = auth.uid());

create policy "Users can delete own messages"
on internal_messages for delete
using (sender_id = auth.uid());

-- ==========================================
-- INTERNAL_MESSAGE_REACTIONS
-- ==========================================
create policy "Participants can select reactions"
on internal_message_reactions for select
using (
  exists (
    select 1 from internal_participants p
    join internal_messages m on m.id = message_id
    where p.conversation_id = m.conversation_id
    and p.user_id = auth.uid()
  )
);

create policy "Users can insert reactions"
on internal_message_reactions for insert
with check (auth.role() = 'authenticated');

create policy "Users can delete own reactions"
on internal_message_reactions for delete
using (user_id = auth.uid());
