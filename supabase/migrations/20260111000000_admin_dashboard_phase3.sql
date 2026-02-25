-- Phase 3: Real-time & Detailed Profit
-- 1. Add cost_price to track profit numbers
-- 2. Update RPCs to calculate Profit

-- 1. Add cost_price to products (Base Cost)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='cost_price') THEN
    ALTER TABLE products ADD COLUMN cost_price numeric DEFAULT 0;
  END IF;
END $$;

-- 2. Add cost_at_purchase to order_items (Historical Cost)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='order_items' AND column_name='cost_at_purchase') THEN
    ALTER TABLE order_items ADD COLUMN cost_at_purchase numeric DEFAULT 0;
  END IF;
END $$;

-- 3. Backfill Data (Heuristic: Cost ~ 70% of Selling Price) for Demo Purpose
-- User should manually update exact costs later
UPDATE products 
SET cost_price = price * 0.7 
WHERE cost_price = 0 OR cost_price IS NULL;

-- Backfill order_items based on current product cost
UPDATE order_items oi
SET cost_at_purchase = p.cost_price
FROM products p
WHERE oi.product_id = p.id AND (oi.cost_at_purchase = 0 OR oi.cost_at_purchase IS NULL);


-- 4. Update Admin Stats to Include Profit
DROP FUNCTION IF EXISTS get_admin_dashboard_stats(timestamptz, timestamptz) CASCADE;
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
    v_total_profit numeric;
    
    v_result json;
BEGIN
    -- Leads
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE source = 'CTV'),
        COUNT(*) FILTER (WHERE source = 'Sales'),
        COUNT(*) FILTER (WHERE stage = 'won')
    INTO 
        v_total_leads,
        v_total_ctv_leads,
        v_total_sales_leads,
        v_converted_leads
    FROM crm_leads
    WHERE created_at >= p_start_date AND created_at <= p_end_date;

    -- Orders & Profit
    -- Revenue = Sum(total_amount)
    -- Profit = Revenue - Sum(cost * quantity)
    -- Note: This is an estimation. Real profit might need tax/handling logic.
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
        'convertedLeads', v_converted_leads,
        'totalOrders', v_total_orders,
        'totalOrderRevenue', v_total_revenue,
        'totalProfit', v_total_profit, -- New Field
        'totalEstimatedRevenue', 0 
    );

    RETURN v_result;
END;
$$;

-- 5. RPC for Top Products (With Profit)
DROP FUNCTION IF EXISTS get_top_products(timestamptz, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS get_top_products(timestamptz, timestamptz, int) CASCADE;
CREATE OR REPLACE FUNCTION get_top_products(
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_limit int DEFAULT 5
)
RETURNS TABLE (
    product_name text,
    sku text,
    total_quantity bigint,
    total_revenue numeric,
    total_profit numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name as product_name,
        p.sku,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.price * oi.quantity) as total_revenue,
        SUM((oi.price - oi.cost_at_purchase) * oi.quantity) as total_profit
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.created_at >= p_start_date 
      AND o.created_at <= p_end_date
      AND o.status NOT IN ('cancelled', 'draft')
    GROUP BY p.id, p.name, p.sku
    ORDER BY total_revenue DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_top_products(timestamptz, timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products(timestamptz, timestamptz, int) TO service_role;
