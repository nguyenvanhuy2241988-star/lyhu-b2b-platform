-- Migration: Notification System
-- Date: 2026-01-13
-- Description: Adds notifications table and RPCs for accessing/updating them.

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'deal', 'task'
    link TEXT, -- Optional URL to navigate to
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb -- For storing related IDs (deal_id, etc.)
);

-- 2. RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System/Admin can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true); -- Ideally restricted, but for simplicity allow service role or triggered inserts

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 4. RPC: Get Unread Notifications (or Recent)
CREATE OR REPLACE FUNCTION get_notifications(
    p_limit INT DEFAULT 20,
    p_only_unread BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    message TEXT,
    type TEXT,
    link TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    metadata JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.link,
        n.is_read,
        n.created_at,
        n.metadata
    FROM notifications n
    WHERE n.user_id = auth.uid()
    AND (NOT p_only_unread OR n.is_read = FALSE)
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 5. RPC: Mark As Read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = p_notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- 6. RPC: Mark All As Read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION get_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
