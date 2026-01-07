-- Step 1: Fix Telesales Data & Recent Activity Freshness

-- 1. Ensure 'updated_at' automatically updates (Fixes Stale Activity)
-- First create the generic function if it doesn't exist (standard Supabase pattern)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for crm_leads
DROP TRIGGER IF EXISTS set_crm_leads_updated_at ON crm_leads;
CREATE TRIGGER set_crm_leads_updated_at
BEFORE UPDATE ON crm_leads
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- 2. Update Admin Stats RPC to include Telesales (Fixes Missing Telesales)
DROP FUNCTION IF EXISTS get_admin_dashboard_stats(timestamptz, timestamptz);

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
    v_total_telesales_leads int; -- New Variable
    v_converted_leads int;
    
    v_total_orders int;
    v_total_revenue numeric;
    v_total_profit numeric;
    
    v_result json;
BEGIN
    -- Leads Aggregation
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE source = 'CTV'),
        COUNT(*) FILTER (WHERE source = 'Sales'),
        COUNT(*) FILTER (WHERE source = 'Telesales'), -- Count Telesales explicitly
        COUNT(*) FILTER (WHERE stage = 'won')
    INTO 
        v_total_leads,
        v_total_ctv_leads,
        v_total_sales_leads,
        v_total_telesales_leads,
        v_converted_leads
    FROM crm_leads
    WHERE created_at >= p_start_date AND created_at <= p_end_date;

    -- Orders & Profit
    SELECT 
        COUNT(DISTINCT o.id),
        COALESCE(SUM(o.total_amount), 0),
        COALESCE(SUM(oi.price * oi.quantity) - SUM(oi.cost_at_purchase * oi.quantity), 0)
    INTO 
        v_total_orders,
        v_total_revenue,
        v_total_profit
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE 
        o.created_at >= p_start_date 
        AND o.created_at <= p_end_date
        AND o.status NOT IN ('cancelled', 'draft');

    v_result := json_build_object(
        'totalLeads', v_total_leads,
        'totalCTVLeads', v_total_ctv_leads,
        'totalSalesLeads', v_total_sales_leads,
        'totalTelesalesLeads', v_total_telesales_leads, -- Return New Field
        'convertedLeads', v_converted_leads,
        'totalOrders', v_total_orders,
        'totalOrderRevenue', v_total_revenue,
        'totalProfit', v_total_profit,
        'totalEstimatedRevenue', 0 
    );

    RETURN v_result;
END;
$$;
