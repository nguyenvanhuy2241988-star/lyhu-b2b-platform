-- Social Care Tables

CREATE TABLE IF NOT EXISTS social_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'zalo', 'tiktok')),
    external_id TEXT NOT NULL, -- Thread ID or Post ID
    page_id UUID REFERENCES facebook_pages(id), -- Link to our Page
    customer_name TEXT,
    customer_avatar TEXT,
    snippet TEXT,
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'spam')),
    assigned_to UUID REFERENCES auth.users(id),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, external_id)
);

CREATE TABLE IF NOT EXISTS social_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES social_conversations(id) ON DELETE CASCADE,
    external_id TEXT, -- Message ID or Comment ID
    content TEXT,
    attachments JSONB, -- Array of URLs
    sender_id TEXT, -- PSID or User ID
    sender_name TEXT,
    is_from_page BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_conversations_last_message ON social_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_messages_conversation ON social_messages(conversation_id);

-- RLS
ALTER TABLE social_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Marketing view conversations" ON social_conversations;
CREATE POLICY "Marketing view conversations" ON social_conversations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin', 'marketing', 'telesales', 'sales'))
    );

DROP POLICY IF EXISTS "Marketing manage conversations" ON social_conversations;
CREATE POLICY "Marketing manage conversations" ON social_conversations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin', 'marketing'))
    );

DROP POLICY IF EXISTS "Marketing view messages" ON social_messages;
CREATE POLICY "Marketing view messages" ON social_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin', 'marketing', 'telesales', 'sales'))
    );

DROP POLICY IF EXISTS "Marketing manage messages" ON social_messages;
CREATE POLICY "Marketing manage messages" ON social_messages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin', 'marketing'))
    );

-- Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'social_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE social_conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'social_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE social_messages;
    END IF;
END $$;
