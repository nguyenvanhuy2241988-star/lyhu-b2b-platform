-- Migration: Add detailed Admin Dashboard Stats RPC
-- Description: Calculates aggregated metrics (Leads, Revenue, Orders) for a specific date range on the server side.

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (usually postgres/admin), bypassing RLS for stats aggregation
AS $$
DECLARE
    v_total_leads int;
    v_total_ctv_leads int;
    v_total_sales_leads int;
    v_converted_leads int;
    
    v_total_orders int;
    v_total_revenue numeric;
    
    v_result json;
BEGIN
    -- 1. Aggregating Leads Data
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE source = 'CTV'),
        COUNT(*) FILTER (WHERE source = 'Sales'),
        COUNT(*) FILTER (WHERE status = 'WON')
    INTO 
        v_total_leads,
        v_total_ctv_leads,
        v_total_sales_leads,
        v_converted_leads
    FROM leads
    WHERE created_at >= p_start_date AND created_at <= p_end_date;

    -- 2. Aggregating Orders Data (Revenue)
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0)
    INTO 
        v_total_orders,
        v_total_revenue
    FROM orders
    WHERE 
        created_at >= p_start_date 
        AND created_at <= p_end_date
        AND status NOT IN ('cancelled', 'draft');

    -- Build the JSON response
    v_result := json_build_object(
        'totalLeads', v_total_leads,
        'totalCTVLeads', v_total_ctv_leads,
        'totalSalesLeads', v_total_sales_leads,
        'convertedLeads', v_converted_leads,
        'totalOrders', v_total_orders,
        'totalOrderRevenue', v_total_revenue,
        'totalEstimatedRevenue', 0 -- Reserved for future logic
    );

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users (so the dashboard can call it)
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats(timestamptz, timestamptz) TO service_role;
