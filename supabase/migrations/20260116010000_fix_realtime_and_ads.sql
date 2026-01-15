-- 1. Enable REPLICA IDENTITY FULL for Realtime filtering support
ALTER TABLE social_conversations REPLICA IDENTITY FULL;
ALTER TABLE social_messages REPLICA IDENTITY FULL;

-- 2. Add Ad columns if they don't exist (Safety check)
ALTER TABLE social_conversations 
ADD COLUMN IF NOT EXISTS ad_id text,
ADD COLUMN IF NOT EXISTS ad_title text,
ADD COLUMN IF NOT EXISTS referral_source text,
ADD COLUMN IF NOT EXISTS ref_parameter text;

-- 3. Update RLS for broader access during testing (Authenticated users)
DROP POLICY IF EXISTS "Marketing view conversations" ON social_conversations;
CREATE POLICY "Marketing view conversations" ON social_conversations
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Marketing manage conversations" ON social_conversations;
CREATE POLICY "Marketing manage conversations" ON social_conversations
    FOR ALL TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Marketing view messages" ON social_messages;
CREATE POLICY "Marketing view messages" ON social_messages
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Marketing manage messages" ON social_messages;
CREATE POLICY "Marketing manage messages" ON social_messages
    FOR ALL TO authenticated
    USING (true);

-- 4. Re-enforce Realtime Publication (Safe version)
-- Check if table is in publication, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'social_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE social_conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'social_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE social_messages;
    END IF;
END $$;
