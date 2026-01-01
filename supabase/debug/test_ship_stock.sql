-- DEBUG: Test RPC fn_ship_stock
-- Run these queries in Supabase SQL Editor

-- 1. Check if function exists with correct signature
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'fn_ship_stock';

-- 2. Get a sample order and its items for testing
SELECT 
    o.id as order_id,
    o.status,
    oi.product_id,
    oi.quantity
FROM orders o 
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'delivered'
LIMIT 3;

-- 3. Get warehouse ID
SELECT id, name FROM warehouses WHERE status = 'active';

-- 4. Test fn_ship_stock directly (replace UUIDs with actual values)
-- UNCOMMENT AND REPLACE THE VALUES BELOW:
/*
SELECT fn_ship_stock(
    'PASTE-WAREHOUSE-ID-HERE'::uuid,
    'PASTE-PRODUCT-ID-HERE'::uuid,
    1,  -- quantity
    'PASTE-ORDER-ID-HERE'::uuid,
    'PASTE-USER-ID-HERE'::uuid
);
*/

-- 5. Check current user permissions
SELECT current_user, current_role;
