-- Zalo Contacts Table
-- Stores contacts/conversations scraped from Zalo sidebar

CREATE TABLE IF NOT EXISTS public.zalo_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id TEXT NOT NULL DEFAULT 'default_staff',
    name TEXT NOT NULL,
    avatar_url TEXT,
    last_message_preview TEXT,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_group BOOLEAN DEFAULT FALSE,
    unread_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, name)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_zalo_contacts_account ON public.zalo_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_zalo_contacts_name ON public.zalo_contacts(name);
CREATE INDEX IF NOT EXISTS idx_zalo_contacts_last_seen ON public.zalo_contacts(last_seen DESC);

-- Disable RLS for simplicity (sync from extension)
ALTER TABLE public.zalo_contacts DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.zalo_contacts TO authenticated;
GRANT ALL ON public.zalo_contacts TO anon;
GRANT ALL ON public.zalo_contacts TO service_role;
