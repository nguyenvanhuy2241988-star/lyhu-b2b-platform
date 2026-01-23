-- Migration: Auto Log CRM Activities
-- Date: 2026-02-01
-- Description: Trigger to automatically log system activities (Stage change, Status change, Create) to crm_activities table.

-- 1. Create Function
CREATE OR REPLACE FUNCTION log_deal_activity() RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_desc text;
BEGIN
    -- Attempt to get current user. If system trigger, default to owner.
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        v_user_id := NEW.owner_user_id;
    END IF;

    -- CASE 1: INSERT (New Deal)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO crm_activities (deal_id, user_id, type, subject, description)
        VALUES (
            NEW.id, 
            v_user_id, 
            'system', 
            'Tạo cơ hội mới', 
            'Đã tạo cơ hội: ' || NEW.title
        );
        RETURN NEW;
    END IF;

    -- CASE 2: UPDATE
    IF TG_OP = 'UPDATE' THEN
        
        -- A. Stage Changed (Moved Column)
        IF OLD.stage IS DISTINCT FROM NEW.stage THEN
            -- Map stage codes to readable labels (Optional, or handled in Frontend. Sticking to code for DB Log)
            INSERT INTO crm_activities (deal_id, user_id, type, subject, description)
            VALUES (
                NEW.id, 
                v_user_id, 
                'system', 
                'Chuyển giai đoạn', 
                format('Đã chuyển giai đoạn từ "%s" sang "%s"', OLD.stage, NEW.stage)
            );
        END IF;

        -- B. Status Changed (Won/Lost/Open)
        IF OLD.status IS DISTINCT FROM NEW.status THEN
             INSERT INTO crm_activities (deal_id, user_id, type, subject, description)
             VALUES (
                NEW.id, 
                v_user_id, 
                'system', 
                'Cập nhật trạng thái', 
                format('Thay đổi trạng thái: "%s" -> "%s"', OLD.status, NEW.status)
            );
        END IF;

        -- C. Owner Changed (Assigned)
        IF OLD.owner_user_id IS DISTINCT FROM NEW.owner_user_id THEN
             INSERT INTO crm_activities (deal_id, user_id, type, subject, description)
             VALUES (
                NEW.id, 
                v_user_id, 
                'system', 
                'Chuyển người phụ trách', 
                'Đã chuyển quyền phụ trách cho user ID: ' || NEW.owner_user_id
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS trg_auto_log_crm_activity ON crm_deals;

CREATE TRIGGER trg_auto_log_crm_activity
AFTER INSERT OR UPDATE ON crm_deals
FOR EACH ROW
EXECUTE FUNCTION log_deal_activity();

-- 3. Verify
SELECT 'Trigger trg_auto_log_crm_activity created successfully' as status;
