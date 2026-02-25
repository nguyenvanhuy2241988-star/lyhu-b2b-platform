-- Fix Double Counting Bug in Revenue
-- Separate Orders calculation from Items calculation

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_leads int;
    v_total_ctv_leads int;
    v_total_sales_leads int;
    v_total_telesales_leads int;
    v_converted_leads int;
    
    v_total_orders int;
    v_total_revenue numeric;
    v_total_profit numeric;
    
    v_result json;
BEGIN
    -- 1. Leads Stats
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE source = 'CTV'),
        COUNT(*) FILTER (WHERE source = 'Sales'),
        COUNT(*) FILTER (WHERE source = 'Telesales'),
        COUNT(*) FILTER (WHERE stage = 'won')
    INTO 
        v_total_leads,
        v_total_ctv_leads,
        v_total_sales_leads,
        v_total_telesales_leads,
        v_converted_leads
    FROM crm_leads
    WHERE created_at >= p_start_date AND created_at <= p_end_date;

    -- 2. Orders Stats (Correct Revenue Calculation)
    -- Calculate Revenue strictly from Orders table to avoid duplication
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

    -- 3. Profit Stats (Requires Join with Items)
    -- Join only valid orders
    SELECT 
        COALESCE(SUM(oi.price * oi.quantity) - SUM(COALESCE(oi.cost_at_purchase, 0) * oi.quantity), 0)
    INTO 
        v_total_profit
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE 
        o.created_at >= p_start_date 
        AND o.created_at <= p_end_date
        AND o.status NOT IN ('cancelled', 'draft');

    v_result := json_build_object(
        'totalLeads', v_total_leads,
        'totalCTVLeads', v_total_ctv_leads,
        'totalSalesLeads', v_total_sales_leads,
        'totalTelesalesLeads', v_total_telesales_leads,
        'convertedLeads', v_converted_leads,
        'totalOrders', v_total_orders,
        'totalOrderRevenue', v_total_revenue,
        'totalProfit', v_total_profit,
        'totalEstimatedRevenue', 0 
    );

    RETURN v_result;
END;
$$;
