-- Migration: 20251230_telesales_metrics_rpc.sql
-- Description: RPC function to calculate telesales metrics on the server for better performance.

CREATE OR REPLACE FUNCTION get_telesales_metrics_v2(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
    v_total_calls BIGINT;
    v_total_orders BIGINT;
    v_total_revenue NUMERIC;
    v_commission_rate NUMERIC := 0.03; -- Default 3%, will move to config in Phase 3
BEGIN
    -- 1. Count calls (tasks marked as done in the period)
    SELECT COUNT(*) INTO v_total_calls
    FROM public.telesales_tasks
    WHERE (user_id = p_user_id OR assigned_to = p_user_id)
      AND status = 'done'
      AND completed_at >= p_start_date
      AND completed_at <= p_end_date;

    -- 2. Aggregate orders
    SELECT 
        COUNT(*), 
        COALESCE(SUM(total_amount), 0)
    INTO v_total_orders, v_total_revenue
    FROM public.orders
    WHERE telesales_user_id = p_user_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
      AND status != 'cancelled';

    -- 3. Return as JSON
    RETURN json_build_object(
        'totalCalls', v_total_calls,
        'totalOrders', v_total_orders,
        'totalRevenue', v_total_revenue,
        'totalCommission', v_total_revenue * v_commission_rate,
        'conversionRate', CASE WHEN v_total_calls = 0 THEN 0 ELSE (v_total_orders::NUMERIC / v_total_calls) * 100 END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_telesales_metrics_v2(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
