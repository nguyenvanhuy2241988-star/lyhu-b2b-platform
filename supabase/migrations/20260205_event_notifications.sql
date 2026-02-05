-- Migration: Event Notifications
-- Date: 2026-02-05
-- Description: Trigger to send notifications to ALL users when an event is published.

-- 1. Create Trigger Function
CREATE OR REPLACE FUNCTION notify_all_users_new_event()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Only trigger when status changes to 'published'
    IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published' OR TG_OP = 'INSERT') THEN
        
        -- Loop through all profiles (assuming all active users have a profile)
        -- We use a cursor loop which is standard in PL/PGSQL for this size
        FOR user_record IN SELECT id FROM profiles WHERE id IS NOT NULL LOOP
            INSERT INTO notifications (user_id, title, message, type, link, created_at)
            VALUES (
                user_record.id,
                'Sự kiện mới: ' || NEW.title,
                'Công ty vừa công bố sự kiện mới: ' || NEW.title || '. Nhấn để xem chi tiết.',
                'task', -- Use 'task' icon (Calendar)
                '/events/' || NEW.id,
                NOW()
            );
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS on_event_published ON hr_events;

CREATE TRIGGER on_event_published
AFTER INSERT OR UPDATE ON hr_events
FOR EACH ROW
EXECUTE FUNCTION notify_all_users_new_event();
