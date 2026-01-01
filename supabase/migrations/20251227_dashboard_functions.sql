-- Add min_stock_level to inventory_levels
-- Run in Supabase SQL Editor

-- 1. Add min_stock_level column with default value
ALTER TABLE inventory_levels 
ADD COLUMN IF NOT EXISTS min_stock_level int DEFAULT 10;

-- 2. Create function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
    product_id uuid,
    product_name text,
    sku text,
    current_stock int,
    min_stock_level int,
    warehouse_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        il.quantity_on_hand as current_stock,
        il.min_stock_level,
        w.name as warehouse_name
    FROM inventory_levels il
    JOIN products p ON p.id = il.product_id
    JOIN warehouses w ON w.id = il.warehouse_id
    WHERE il.quantity_on_hand < il.min_stock_level
    ORDER BY (il.min_stock_level - il.quantity_on_hand) DESC
$$;

-- 3. Create function to get revenue by date
CREATE OR REPLACE FUNCTION get_revenue_by_date(
    p_days int DEFAULT 30
)
RETURNS TABLE (
    date text,
    revenue numeric,
    order_count int
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        TO_CHAR(DATE(created_at), 'DD/MM') as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*)::int as order_count
    FROM orders
    WHERE created_at >= CURRENT_DATE - p_days
    AND status != 'cancelled'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
$$;

SELECT 'Dashboard functions created!' as status;
