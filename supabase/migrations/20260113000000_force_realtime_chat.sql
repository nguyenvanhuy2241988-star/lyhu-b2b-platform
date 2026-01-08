-- Force Realtime for Order Messages (Step 4)
-- Run this in Supabase SQL Editor

-- 1. Ensure table exists (sanity check)
CREATE TABLE IF NOT EXISTS order_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id),
    sender_name text NOT NULL,
    sender_role text NOT NULL,
    content text,
    image_url text,
    created_at timestamptz DEFAULT now()
);

-- 2. Force Enable RLS and permissive policy
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_read_order_messages" ON order_messages;
CREATE POLICY "users_can_read_order_messages" ON order_messages
    FOR SELECT TO authenticated
    USING (true);

-- 3. Force Add to Publication (Idempotent way)
-- We remove it first to be sure, then add it back.
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE order_messages;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if not exists
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;

-- 4. Set Replica Identity properly for DELETE/UPDATE events (good practice)
ALTER TABLE order_messages REPLICA IDENTITY FULL;

SELECT 'Realtime FORCED for order_messages' as status;
