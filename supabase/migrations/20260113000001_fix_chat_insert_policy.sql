-- Fix RLS Policy for Sending Messages (Step 5)
-- Run this in Supabase SQL Editor

-- 1. Restore INSERT policy for authenticated users
DROP POLICY IF EXISTS "users_can_send_messages" ON order_messages;

CREATE POLICY "users_can_send_messages" ON order_messages
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 2. Ensure SELECT policy is still there (redundancy check)
DROP POLICY IF EXISTS "users_can_read_order_messages" ON order_messages;
CREATE POLICY "users_can_read_order_messages" ON order_messages
    FOR SELECT TO authenticated
    USING (true);

SELECT 'Fixed INSERT policy for order_messages' as status;
