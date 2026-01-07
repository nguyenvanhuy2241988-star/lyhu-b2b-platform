-- Migration: Admin Dashboard Fixes (Phase 1)
-- 1. Add 'source' column to crm_leads
-- 2. Update get_admin_dashboard_stats RPC to use real source data
-- 3. Create get_low_stock_items RPC for accurate stock warnings (filtering inactive/deleted products)

-- 1. Add source column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='crm_leads' AND column_name='source') THEN
    ALTER TABLE crm_leads ADD COLUMN source text DEFAULT 'Sales';
  END IF;
END $$;

-- Backfill existing data
UPDATE crm_leads SET source = 'Sales' WHERE source IS NULL;

-- 2. Update Admin Dashboard Stats RPC
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
    v_converted_leads int;
    
    v_total_orders int;
    v_total_revenue numeric;
    
    v_result json;
BEGIN
    -- 1. Aggregating Leads Data (Table: crm_leads)
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE source = 'CTV'),
        COUNT(*) FILTER (WHERE source = 'Sales'), -- Now using real source column
        COUNT(*) FILTER (WHERE stage = 'won')
    INTO 
        v_total_leads,
        v_total_ctv_leads,
        v_total_sales_leads,
        v_converted_leads
    FROM crm_leads
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
        'totalEstimatedRevenue', 0 
    );

    RETURN v_result;
END;
$$;

-- 3. Create/Update Low Stock RPC
CREATE OR REPLACE FUNCTION get_low_stock_items(
    p_limit int DEFAULT 10
)
RETURNS TABLE (
    product_id uuid,
    product_name text,
    sku text,
    current_stock int,
    min_stock_level int,
    warehouse_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        il.quantity_on_hand as current_stock,
        COALESCE(il.min_stock_level, 10) as min_stock_level,
        w.name as warehouse_name
    FROM inventory_levels il
    JOIN products p ON il.product_id = p.id
    JOIN warehouses w ON il.warehouse_id = w.id
    WHERE 
        il.quantity_on_hand < COALESCE(il.min_stock_level, 10)
        AND p.is_active = true -- Filter out deleted/inactive products
    ORDER BY il.quantity_on_hand ASC
    LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats(timestamptz, timestamptz) TO service_role;

GRANT EXECUTE ON FUNCTION get_low_stock_items(int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_items(int) TO service_role;
