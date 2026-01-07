-- Migration: Add Revenue Chart RPC with Date Range
-- Description: Groups revenue by date for chart visualization.

CREATE OR REPLACE FUNCTION get_revenue_chart_data(
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS TABLE (
    date text,
    revenue numeric,
    orders bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Group by date (converted to VN time for accurate daily reporting)
        to_char(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') as date_key,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as order_count
    FROM orders
    WHERE 
        created_at >= p_start_date 
        AND created_at <= p_end_date
        AND status NOT IN ('cancelled', 'draft')
    GROUP BY 1
    ORDER BY 1;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_revenue_chart_data(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_chart_data(timestamptz, timestamptz) TO service_role;
