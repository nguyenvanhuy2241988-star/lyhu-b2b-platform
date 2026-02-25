-- Phase 2: Advanced Analytics RPCs

-- 1. Top Selling Products
-- Returns best selling products by revenue and quantity
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
    total_revenue numeric
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
        SUM(oi.price * oi.quantity) as total_revenue
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

-- 2. Lead Stage Distribution (Funnel)
-- Returns count of leads in each stage
DROP FUNCTION IF EXISTS get_lead_funnel_stats(timestamptz, timestamptz) CASCADE;
CREATE OR REPLACE FUNCTION get_lead_funnel_stats(
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS TABLE (
    stage_name text,
    lead_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        stage as stage_name,
        COUNT(*) as lead_count
    FROM crm_leads
    WHERE created_at >= p_start_date 
      AND created_at <= p_end_date
    GROUP BY stage
    ORDER BY lead_count DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_top_products(timestamptz, timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products(timestamptz, timestamptz, int) TO service_role;

GRANT EXECUTE ON FUNCTION get_lead_funnel_stats(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_lead_funnel_stats(timestamptz, timestamptz) TO service_role;
