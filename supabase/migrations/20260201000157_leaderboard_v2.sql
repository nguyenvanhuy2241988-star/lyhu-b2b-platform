-- Migration: Realtime Leaderboard V2 (Source: Orders, Status: Delivered)
-- Date: 2026-02-01
-- Description: Updates leaderboard logic to use 'orders' table instead of 'crm_deals'.
--              Only counts orders with status = 'delivered'.
--              Supports flexible date range via p_start_date and p_end_date.

CREATE OR REPLACE FUNCTION get_realtime_leaderboard_v2(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_revenue NUMERIC,
    total_orders BIGINT,
    rank INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            o.telesales_user_id,
            COALESCE(SUM(o.total_amount), 0) as revenue,
            COUNT(o.id) as order_count
        FROM orders o
        WHERE o.status = 'delivered'
        AND o.telesales_user_id IS NOT NULL
        AND o.created_at BETWEEN p_start_date AND p_end_date
        GROUP BY o.telesales_user_id
    )
    SELECT 
        p.id as user_id,
        COALESCE(p.full_name, p.email, 'Unknown') as full_name,
        p.avatar_url,
        COALESCE(s.revenue, 0) as total_revenue,
        COALESCE(s.order_count, 0) as total_orders,
        RANK() OVER (ORDER BY COALESCE(s.revenue, 0) DESC)::INT as rank
    FROM profiles p
    LEFT JOIN stats s ON p.id = s.telesales_user_id
    WHERE p.role IN ('telesales', 'sales', 'sale_admin')
    ORDER BY total_revenue DESC, total_orders DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_realtime_leaderboard_v2 TO authenticated;
