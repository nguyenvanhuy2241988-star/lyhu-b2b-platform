-- Order Messages Schema for Real-Time Chat
-- Run in Supabase SQL Editor

-- 1. Create order_messages table
CREATE TABLE IF NOT EXISTS order_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id),
    sender_name text NOT NULL,
    sender_role text NOT NULL, -- 'admin', 'telesales', 'accountant', 'warehouse'
    content text,
    image_url text, -- For image attachments
    created_at timestamptz DEFAULT now()
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON order_messages(created_at DESC);

-- 3. Enable RLS
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies
DROP POLICY IF EXISTS "users_can_read_order_messages" ON order_messages;
DROP POLICY IF EXISTS "users_can_send_messages" ON order_messages;

-- 5. All authenticated users can read messages
drop policy if exists "users_can_read_order_messages" on order_messages;
CREATE POLICY "users_can_read_order_messages" ON order_messages
    FOR SELECT TO authenticated
    USING (true);

-- 6. Authenticated users can send messages (allow any authenticated user)
drop policy if exists "users_can_send_messages" on order_messages;
CREATE POLICY "users_can_send_messages" ON order_messages
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 7. Enable realtime (skip if already added)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 8. Create storage bucket for chat images (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('chat-images', 'chat-images', true)
-- ON CONFLICT DO NOTHING;

SELECT 'Order messages table created!' as status;
