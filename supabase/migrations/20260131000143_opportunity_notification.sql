-- Migration: Add Opportunity Notification with Deep Link
-- Date: 2026-01-31 (Part 2)
-- Description: Creates a trigger on crm_deals to notify assigned user with a deep link to the CRM page.

CREATE OR REPLACE FUNCTION notify_deal_assigned()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if assigned_to changed or on insert
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.owner_user_id IS DISTINCT FROM NEW.owner_user_id))
       AND NEW.owner_user_id IS NOT NULL 
       AND NEW.owner_user_id != auth.uid() THEN 
        
        INSERT INTO notifications (
            user_id, 
            type, 
            title, 
            message, 
            link, 
            metadata
        )
        VALUES (
            NEW.owner_user_id,
            'deal', -- Icon type for Opportunity
            'Bạn được giao cơ hội mới',
            FORMAT('Cơ hội "%s" đã được giao cho bạn.', NEW.title),
            '/crm?dealId=' || NEW.id,
            jsonb_build_object('deal_id', NEW.id, 'priority', NEW.priority)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS trg_notify_deal_assigned ON crm_deals;

CREATE TRIGGER trg_notify_deal_assigned
AFTER INSERT OR UPDATE ON crm_deals
FOR EACH ROW
EXECUTE FUNCTION notify_deal_assigned();

SELECT 'Opportunity notification trigger created successfully.' as status;
