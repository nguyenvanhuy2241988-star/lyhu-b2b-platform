-- Create get_low_stock_items RPC
-- Used by Admin Dashboard to alerting low stock
CREATE OR REPLACE FUNCTION get_low_stock_items(p_limit int DEFAULT 5)
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
        il.product_id,
        p.name as product_name,
        p.sku,
        il.quantity_on_hand as current_stock,
        COALESCE(p.min_stock_level, 10) as min_stock_level,
        w.name as warehouse_name
    FROM inventory_levels il
    JOIN products p ON il.product_id = p.id
    JOIN warehouses w ON il.warehouse_id = w.id
    WHERE 
        il.quantity_on_hand <= COALESCE(p.min_stock_level, 10)
        AND p.is_active = true
    ORDER BY il.quantity_on_hand ASC
    LIMIT p_limit;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_low_stock_items(int) TO authenticated, service_role;
