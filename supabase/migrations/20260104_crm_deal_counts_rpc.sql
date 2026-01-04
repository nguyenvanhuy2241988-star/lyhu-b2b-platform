-- Create a function to get counts of deals by stage, with optional owner filtering
CREATE OR REPLACE FUNCTION get_crm_deal_counts(p_owner_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_object_agg(stage, count) INTO result FROM (
        SELECT stage, COUNT(*) as count 
        FROM crm_deals 
        WHERE (p_owner_id IS NULL OR owner_user_id = p_owner_id)
        GROUP BY stage
    ) as counts;
    RETURN COALESCE(result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_crm_deal_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_crm_deal_counts(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_crm_deal_counts(UUID) TO service_role;
