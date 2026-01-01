-- TRIGGER TO AUTO-UPDATE DEAL EXPECTED VALUE
-- Run this in Supabase SQL Editor

-- 1. Create Function to Calculate Total
CREATE OR REPLACE FUNCTION fn_update_crm_deal_expected_value()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent deal's expected_value
    UPDATE crm_deals
    SET expected_value = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM crm_deal_items
        WHERE deal_id = COALESCE(NEW.deal_id, OLD.deal_id)
    )
    WHERE id = COALESCE(NEW.deal_id, OLD.deal_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS trg_update_crm_deal_expected_value ON crm_deal_items;

CREATE TRIGGER trg_update_crm_deal_expected_value
AFTER INSERT OR UPDATE OR DELETE ON crm_deal_items
FOR EACH ROW
EXECUTE FUNCTION fn_update_crm_deal_expected_value();

SELECT 'Trigger trg_update_crm_deal_expected_value created successfully' as message;
