-- Create table for monitored Zalo accounts (Staff accounts)
CREATE TABLE IF NOT EXISTS public.zalo_sync_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- Name of the staff/account (e.g. "NV Sale 1")
    zalo_id TEXT, -- Detected Zalo ID
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for synced messages
CREATE TABLE IF NOT EXISTS public.zalo_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES public.zalo_sync_accounts(id) ON DELETE CASCADE, -- Belongs to which monitoring account
    msg_id TEXT NOT NULL, -- Zalo's message ID (to prevent duplicates)
    
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    sender_avatar TEXT,
    
    receiver_id TEXT NOT NULL,
    receiver_name TEXT,
    
    content TEXT,
    attachments JSONB, -- Store array of image URLs/files
    msg_type TEXT DEFAULT 'text', -- text, image, sticker...
    
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- The specific time of the message
    direction TEXT CHECK (direction IN ('incoming', 'outgoing')), -- 'incoming': Customer sent, 'outgoing': Staff sent
    
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.zalo_sync_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zalo_messages ENABLE ROW LEVEL SECURITY;

-- Policies (Simple for now: Authenticated users/Admins have full access)
-- In production, you might want to restrict this further.
CREATE POLICY "Allow authenticated full access accounts" ON public.zalo_sync_accounts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access messages" ON public.zalo_messages
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update 'last_synced_at'
CREATE OR REPLACE FUNCTION update_zalo_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.zalo_sync_accounts
    SET last_synced_at = NEW.timestamp
    WHERE id = NEW.account_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp when new message arrives
CREATE TRIGGER on_new_zalo_message
    AFTER INSERT ON public.zalo_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_zalo_account_timestamp();
