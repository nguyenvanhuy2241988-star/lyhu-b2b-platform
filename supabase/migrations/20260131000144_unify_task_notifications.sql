-- Migration: Unify Task Notifications to Global System
-- Date: 2026-01-31
-- Description: Updates the task assignment trigger to write to the global 'notifications' table
--              instead of 'telesales_notifications'. This enables consistent UI and deep linking.

-- 1. Update the notification function
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
BEGIN
    -- Only notify if assigned_to changed and is different from creator/updater
    -- Also ensure we don't notify ourselves if we assign to ourselves (optional, but good UX)
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to))
       AND NEW.assigned_to IS NOT NULL 
       AND NEW.assigned_to != auth.uid() THEN -- Don't notify if assigning to self
        
        -- Get creator name for better message (optional)
        -- SELECT full_name INTO v_user_name FROM profiles WHERE id = auth.uid();
        
        INSERT INTO notifications (
            user_id, 
            type, 
            title, 
            message, 
            link, 
            metadata
        )
        VALUES (
            NEW.assigned_to,
            'task',
            'Bạn được giao việc mới',
            FORMAT('Công việc "%s" đã được giao cho bạn.', NEW.title),
            '/telesales/tasks?taskId=' || NEW.id,
            jsonb_build_object('task_id', NEW.id, 'priority', NEW.priority)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verify and Re-create Trigger (Just to be safe, though REPLACE FUNCTION is usually enough)
-- The trigger 'trg_notify_task_assigned' already exists on 'telesales_tasks' from previous migrations,
-- calling 'notify_task_assigned()'. We just updated the function logic.

SELECT 'Task notification logic updated to use global notifications table.' as status;
