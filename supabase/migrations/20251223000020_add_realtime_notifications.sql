-- =====================================================
-- ENABLE SUPABASE REALTIME FOR TELESALES TASKS
-- Created: 2025-12-23
-- Purpose: Real-time notifications for task updates
-- =====================================================

-- Enable Realtime on telesales_tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'telesales_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.telesales_tasks;
  END IF;
END $$;

-- Create notification events table
CREATE TABLE IF NOT EXISTS telesales_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES telesales_tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'assigned', 'updated', 'overdue', 'completed'
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE telesales_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
drop policy if exists "Users can view their own notifications" on telesales_notifications;
CREATE POLICY "Users can view their own notifications"
ON telesales_notifications FOR SELECT
USING (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on telesales_notifications;
CREATE POLICY "Users can update their own notifications"
ON telesales_notifications FOR UPDATE
USING (auth.uid() = user_id);

drop policy if exists "System can create notifications" on telesales_notifications;
CREATE POLICY "System can create notifications"
ON telesales_notifications FOR INSERT
WITH CHECK (true); -- Will be triggered by function

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON telesales_notifications(user_id, is_read, created_at DESC);

-- Function: Create notification when task is assigned
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if assigned_to changed and is different from creator
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to))
       AND NEW.assigned_to IS NOT NULL 
       AND NEW.assigned_to != NEW.user_id THEN
        
        INSERT INTO telesales_notifications (user_id, task_id, type, title, message)
        VALUES (
            NEW.assigned_to,
            NEW.id,
            'assigned',
            'Bạn được giao việc mới',
            FORMAT('Công việc "%s" đã được giao cho bạn', NEW.title)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task assignment
DROP TRIGGER IF EXISTS trg_notify_task_assigned ON telesales_tasks;
CREATE TRIGGER trg_notify_task_assigned
AFTER INSERT OR UPDATE OF assigned_to ON telesales_tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_assigned();

-- Function: Mark old notifications as read (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Mark notifications older than 7 days as read
    UPDATE telesales_notifications
    SET is_read = TRUE
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON TABLE telesales_notifications IS 'Stores in-app notifications for task updates and assignments';
COMMENT ON FUNCTION notify_task_assigned() IS 'Automatically creates notification when task is assigned to someone';
