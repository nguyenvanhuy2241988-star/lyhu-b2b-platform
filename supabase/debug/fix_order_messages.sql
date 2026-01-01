-- FIX: Order Messages - Remove FK constraint + Disable RLS
-- Run this in Supabase SQL Editor

-- 1. Drop existing table if exists (to recreate cleanly)
DROP TABLE IF EXISTS order_messages CASCADE;

-- 2. Create table WITHOUT foreign key on sender_id
CREATE TABLE order_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    sender_id text NOT NULL, -- Changed to TEXT (no FK constraint)
    sender_name text NOT NULL,
    sender_role text NOT NULL,
    content text,
    image_url text,
    created_at timestamptz DEFAULT now()
);

-- 3. DISABLE RLS completely
ALTER TABLE order_messages DISABLE ROW LEVEL SECURITY;

-- 4. Enable realtime
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

SELECT 'order_messages table created successfully!' as status;
