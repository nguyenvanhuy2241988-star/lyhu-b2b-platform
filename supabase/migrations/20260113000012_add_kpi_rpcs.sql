-- Migration: Add KPI Reporting RPCs & Calendar Optimization
-- Date: 2026-01-13
-- Description: Adds functions for Dashboard KPI and Indexes for Calendar

-- 1. Index for Calendar Query Performance
CREATE INDEX IF NOT EXISTS idx_crm_deals_next_action_at 
ON public.crm_deals (next_action_at) 
WHERE next_action_at IS NOT NULL;

-- 2. Function: Get General KPI Stats (Revenue, Calls, Conversion)
CREATE OR REPLACE FUNCTION get_telesales_kpi_stats(
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
    -- 1. Calculate Revenue (Won Deals)
    SELECT COALESCE(SUM(expected_value), 0), COUNT(*)
    INTO v_total_revenue, v_total_deals_won
    FROM crm_deals
    WHERE status = 'won'
    AND (p_user_id IS NULL OR owner_user_id = p_user_id)
    AND (closed_at BETWEEN p_start_date AND p_end_date OR updated_at BETWEEN p_start_date AND p_end_date); 
    -- Note: Ideally 'closed_at' should be used, fallback to updated_at if null

    -- 2. Calculate New Deals (Assigned/Created)
    SELECT COUNT(*)
    INTO v_total_deals_new
    FROM crm_deals
    WHERE (p_user_id IS NULL OR owner_user_id = p_user_id)
    AND created_at BETWEEN p_start_date AND p_end_date;

    -- 3. Calculate Call Stats
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

-- 3. Function: Get Sales Funnel (Deals by Stage)
CREATE OR REPLACE FUNCTION get_sales_funnel(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    stage TEXT,
    total_count BIGINT,
    total_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.stage::TEXT,
        COUNT(*)::BIGINT,
        COALESCE(SUM(d.expected_value), 0)::NUMERIC
    FROM crm_deals d
    WHERE (p_user_id IS NULL OR d.owner_user_id = p_user_id)
    AND d.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY d.stage
    ORDER BY total_count DESC;
END;
$$;

-- 4. Function: Get Failed Reasons Stats
CREATE OR REPLACE FUNCTION get_failed_reasons_stats(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    lost_reason TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.lost_reason,
        COUNT(*)::BIGINT
    FROM crm_deals d
    WHERE d.status = 'lost'
    AND d.lost_reason IS NOT NULL
    AND (p_user_id IS NULL OR d.owner_user_id = p_user_id)
    AND d.updated_at BETWEEN p_start_date AND p_end_date -- Assume updated_at is roughly when it was lost
    GROUP BY d.lost_reason
    ORDER BY total_count DESC;
END;
$$;

-- Grant permissions (if needed, usually Postgres default is fine for authenticated but good to be explicit)
GRANT EXECUTE ON FUNCTION get_telesales_kpi_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_funnel TO authenticated;
GRANT EXECUTE ON FUNCTION get_failed_reasons_stats TO authenticated;
