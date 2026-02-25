-- Migration: Update KPI RPCs to use Orders for Revenue (Truth)
-- Date: 2026-02-01
-- Description: Switches Revenue and Won Deal calculation to use 'orders' table (delivered) instead of 'crm_deals'.

CREATE OR REPLACE FUNCTION get_telesales_kpi_stats_v2(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_revenue NUMERIC,
    total_deals_won BIGINT,
    total_deals_new BIGINT,
    total_calls BIGINT,
    avg_call_duration NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_revenue NUMERIC;
    v_total_deals_won BIGINT;
    v_total_deals_new BIGINT;
    v_total_calls BIGINT;
    v_avg_call_duration NUMERIC;
BEGIN
    -- 1. Calculate Revenue & Won Deals from ORDERS (delivered)
    -- This ensures consistency with Leaderboard V2
    SELECT COALESCE(SUM(total_amount), 0), COUNT(*)
    INTO v_total_revenue, v_total_deals_won
    FROM orders
    WHERE status = 'delivered'
    AND telesales_user_id IS NOT NULL
    AND (p_user_id IS NULL OR telesales_user_id = p_user_id)
    AND created_at BETWEEN p_start_date AND p_end_date;

    -- 2. Calculate New Deals (Assigned/Created) from CRM_DEALS
    -- This tracks the INPUT of the funnel (Assigned Data)
    SELECT COUNT(*)
    INTO v_total_deals_new
    FROM crm_deals
    WHERE (p_user_id IS NULL OR owner_user_id = p_user_id)
    AND created_at BETWEEN p_start_date AND p_end_date;

    -- 3. Calculate Call Stats from CRM_ACTIVITIES
    SELECT COUNT(*), COALESCE(AVG(call_duration_seconds), 0)
    INTO v_total_calls, v_avg_call_duration
    FROM crm_activities
    WHERE type = 'call'
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND created_at BETWEEN p_start_date AND p_end_date;

    RETURN QUERY SELECT 
        v_total_revenue, 
        v_total_deals_won, 
        v_total_deals_new, 
        v_total_calls, 
        v_avg_call_duration;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_telesales_kpi_stats_v2 TO authenticated;
