-- Enhanced function to get counts of deals by stage AND global metrics (overdue/today)
CREATE OR REPLACE FUNCTION get_crm_deal_counts(p_owner_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    stage_results JSON;
    overdue_val INT;
    today_val INT;
BEGIN
    -- Counts by stage
    SELECT json_object_agg(stage, count) INTO stage_results FROM (
        SELECT stage, COUNT(*) as count 
        FROM crm_deals 
        WHERE (p_owner_id IS NULL OR owner_user_id = p_owner_id)
        GROUP BY stage
    ) as counts;

    -- Overdue count (next_action_at < today)
    SELECT COUNT(*) INTO overdue_val 
    FROM crm_deals 
    WHERE (p_owner_id IS NULL OR owner_user_id = p_owner_id)
      AND status = 'open' 
      AND next_action_at < CURRENT_DATE;

    -- Today count (next_action_at is today)
    SELECT COUNT(*) INTO today_val 
    FROM crm_deals 
    WHERE (p_owner_id IS NULL OR owner_user_id = p_owner_id)
      AND status = 'open' 
      AND next_action_at::DATE = CURRENT_DATE;

    RETURN json_build_object(
        'stages', COALESCE(stage_results, '{}'::JSON),
        'overdue', COALESCE(overdue_val, 0),
        'today', COALESCE(today_val, 0)
    );
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_crm_deal_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_crm_deal_counts(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_crm_deal_counts(UUID) TO service_role;
