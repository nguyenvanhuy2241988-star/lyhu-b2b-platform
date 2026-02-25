-- In-App Notifications Schema
-- Run in Supabase SQL Editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'order'
    is_read boolean DEFAULT false,
    link text, -- Optional link to navigate
    metadata jsonb, -- Extra data like order_id
    created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies first
DROP POLICY IF EXISTS "users_read_own_notifications" ON notifications;
DROP POLICY IF EXISTS "insert_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;

-- 4. Users can read their own notifications (or broadcast)
drop policy if exists "users_read_own_notifications" on notifications;
CREATE POLICY "users_read_own_notifications" ON notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL);

-- 5. Allow insert for system
drop policy if exists "insert_notifications" on notifications;
CREATE POLICY "insert_notifications" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 6. Users can update (mark as read) their own
drop policy if exists "users_update_own_notifications" on notifications;
CREATE POLICY "users_update_own_notifications" ON notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL);

-- 6. Enable realtime for notifications (skip if already added)
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7. Create function to notify admins on new order
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert notification for all admins (user_id = NULL means broadcast)
    INSERT INTO notifications (user_id, title, message, type, link, metadata)
    VALUES (
        NULL, -- Broadcast to all
        '🛒 Đơn hàng mới!',
        COALESCE(NEW.customer_name, 'Khách hàng') || ' - ' || 
            TO_CHAR(NEW.total_amount, 'FM999,999,999') || ' đ',
        'order',
        '/admin/orders',
        jsonb_build_object('order_id', NEW.id)
    );
    RETURN NEW;
END;
$$;

-- 8. Create trigger
DROP TRIGGER IF EXISTS on_new_order_notify ON orders;
CREATE TRIGGER on_new_order_notify
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();

SELECT 'Notifications system created!' as status;
