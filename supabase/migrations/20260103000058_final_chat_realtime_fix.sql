-- FINAL REALTIME & PERMISSION REPAIR (V7)
-- This script fixes the missing chat messages by re-enabling Realtime correctly.

-- 1. Ensure chat tables are in the Realtime publication
-- Note: 'supabase_realtime' publication is usually managed by Supabase, 
-- but we make sure the chat tables are explicitly included.
DO $$
BEGIN
    -- Messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
    END IF;

    -- Conversations
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_conversations;
    END IF;

    -- Participants
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_participants;
    END IF;
END $$;

-- 2. Set REPLICA IDENTITY to FULL for all chat tables
-- This ensures Realtime updates contain old data and are broadcasted reliably.
ALTER TABLE public.internal_messages REPLICA IDENTITY FULL;
ALTER TABLE public.internal_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.internal_participants REPLICA IDENTITY FULL;

-- 3. Ensure Permissions for 'authenticated' role
-- Realtime server needs to be able to read these tables as the user.
GRANT SELECT ON public.internal_messages TO authenticated;
GRANT SELECT ON public.internal_conversations TO authenticated;
GRANT SELECT ON public.internal_participants TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 4. Verify Policy for real-time reads
-- Users must have SELECT access via RLS or Realtime won't send the data.
-- This policy is already standard, but we ensure it's robust.
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.internal_messages;
CREATE POLICY "Users can view messages in their conversations"
    ON public.internal_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.internal_participants
            WHERE conversation_id = internal_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- 5. Force a reload of PostgREST config (optional but good practice)
NOTIFY pgrst, 'reload config';

SELECT 'Realtime for Chat has been successfully re-enabled' as status;
