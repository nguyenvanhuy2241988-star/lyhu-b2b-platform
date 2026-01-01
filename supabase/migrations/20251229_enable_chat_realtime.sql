-- Enable Realtime for Chat Tables
-- Required for postgres_changes subscriptions to work

-- Check if tables are already in publication, if not add them
-- Using alter publication syntax

-- Method: Drop and re-add to ensure clean state for chat tables
-- Note: This won't affect other tables already in the publication

-- First, check current publication (this is informational, the actual fix is below)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Add chat tables to Realtime publication
-- If they're already in, this will error, but we use IF NOT EXISTS workaround

DO $$
BEGIN
    -- Add internal_messages to Realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
        RAISE NOTICE 'Added internal_messages to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'internal_messages already in supabase_realtime publication';
    END IF;

    -- Add internal_conversations to Realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_conversations;
        RAISE NOTICE 'Added internal_conversations to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'internal_conversations already in supabase_realtime publication';
    END IF;

    -- Add internal_participants to Realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_participants;
        RAISE NOTICE 'Added internal_participants to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'internal_participants already in supabase_realtime publication';
    END IF;

    -- Add internal_message_reactions to Realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'internal_message_reactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_message_reactions;
        RAISE NOTICE 'Added internal_message_reactions to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'internal_message_reactions already in supabase_realtime publication';
    END IF;
END $$;

-- Reload config to ensure Realtime picks up changes
NOTIFY pgrst, 'reload config';
