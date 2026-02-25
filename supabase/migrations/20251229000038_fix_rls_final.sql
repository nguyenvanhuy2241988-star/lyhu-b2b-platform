-- DEFINITIVE FIX for Chat Realtime RLS
-- The previous policies had AMBIGUOUS column references causing Realtime to fail

-- Step 1: Drop ALL existing policies on chat tables
DROP POLICY IF EXISTS "Authenticated can view participants" ON internal_participants;
DROP POLICY IF EXISTS "Authenticated can insert participants" ON internal_participants;
DROP POLICY IF EXISTS "Users can see their own participation" ON internal_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON internal_participants;
DROP POLICY IF EXISTS "Participants can view conversations" ON internal_conversations;
DROP POLICY IF EXISTS "Authenticated can create conversations" ON internal_conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON internal_conversations;
DROP POLICY IF EXISTS "Participants can select messages" ON internal_messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON internal_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON internal_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON internal_messages;
DROP POLICY IF EXISTS "Participants can select reactions" ON internal_message_reactions;
DROP POLICY IF EXISTS "Users can insert reactions" ON internal_message_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON internal_message_reactions;

-- Step 2: Re-enable RLS (in case it was disabled during debugging)
ALTER TABLE internal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_message_reactions ENABLE ROW LEVEL SECURITY;

-- Step 3: Create FIXED policies with EXPLICIT table references

-- INTERNAL_PARTICIPANTS: Allow all authenticated users to read (needed for Realtime to work)
drop policy if exists "select_participants_authenticated" on internal_participants;
CREATE POLICY "select_participants_authenticated"
ON internal_participants FOR SELECT
TO authenticated
USING (true);

drop policy if exists "insert_participants_authenticated" on internal_participants;
CREATE POLICY "insert_participants_authenticated"
ON internal_participants FOR INSERT
TO authenticated
WITH CHECK (true);

-- INTERNAL_CONVERSATIONS: Allow participants to view
drop policy if exists "select_conversations_participants" on internal_conversations;
CREATE POLICY "select_conversations_participants"
ON internal_conversations FOR SELECT
TO authenticated
USING (
    is_public = true 
    OR 
    EXISTS (
        SELECT 1 FROM internal_participants p 
        WHERE p.conversation_id = internal_conversations.id 
        AND p.user_id = auth.uid()
    )
);

drop policy if exists "insert_conversations_authenticated" on internal_conversations;
CREATE POLICY "insert_conversations_authenticated"
ON internal_conversations FOR INSERT
TO authenticated
WITH CHECK (true);

drop policy if exists "update_conversations_participants" on internal_conversations;
CREATE POLICY "update_conversations_participants"
ON internal_conversations FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM internal_participants p 
        WHERE p.conversation_id = internal_conversations.id 
        AND p.user_id = auth.uid()
    )
);

-- INTERNAL_MESSAGES: CRITICAL for Realtime
-- Fixed: Explicit reference to internal_messages.conversation_id
drop policy if exists "select_messages_participants" on internal_messages;
CREATE POLICY "select_messages_participants"
ON internal_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM internal_participants p 
        WHERE p.conversation_id = internal_messages.conversation_id 
        AND p.user_id = auth.uid()
    )
);

drop policy if exists "insert_messages_participants" on internal_messages;
CREATE POLICY "insert_messages_participants"
ON internal_messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM internal_participants p 
        WHERE p.conversation_id = internal_messages.conversation_id 
        AND p.user_id = auth.uid()
    )
);

drop policy if exists "update_messages_owner" on internal_messages;
CREATE POLICY "update_messages_owner"
ON internal_messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

drop policy if exists "delete_messages_owner" on internal_messages;
CREATE POLICY "delete_messages_owner"
ON internal_messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- INTERNAL_MESSAGE_REACTIONS
drop policy if exists "select_reactions_participants" on internal_message_reactions;
CREATE POLICY "select_reactions_participants"
ON internal_message_reactions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM internal_participants p
        JOIN internal_messages m ON m.id = internal_message_reactions.message_id
        WHERE p.conversation_id = m.conversation_id
        AND p.user_id = auth.uid()
    )
);

drop policy if exists "insert_reactions_authenticated" on internal_message_reactions;
CREATE POLICY "insert_reactions_authenticated"
ON internal_message_reactions FOR INSERT
TO authenticated
WITH CHECK (true);

drop policy if exists "delete_reactions_owner" on internal_message_reactions;
CREATE POLICY "delete_reactions_owner"
ON internal_message_reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Step 4: Ensure tables are in Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_participants;
    END IF;
END $$;

-- Step 5: Force reload
NOTIFY pgrst, 'reload config';
