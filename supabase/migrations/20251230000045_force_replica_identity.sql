-- Force REPLICA IDENTITY FULL for Realtime reliability
-- This ensures that the WAL (Write Ahead Log) contains all column values for updates/deletes,
-- and helps Realtime server process changes more reliably.

ALTER TABLE public.internal_messages REPLICA IDENTITY FULL;
ALTER TABLE public.internal_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.internal_participants REPLICA IDENTITY FULL;

-- Also double check publication (Idempotent approach)
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
