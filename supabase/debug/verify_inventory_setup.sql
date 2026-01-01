-- DEBUG: Verify Inventory System Setup
-- Run these queries in Supabase SQL Editor to check setup

-- 1. Check if warehouse exists
SELECT * FROM warehouses;

-- 2. Check if inventory_levels has any data
SELECT * FROM inventory_levels LIMIT 10;

-- 3. Check if products exist
SELECT id, name, sku FROM products LIMIT 5;

-- 4. Test RPC fn_reserve_stock exists (should return function definition)
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'fn_reserve_stock';

-- 5. If warehouse and products exist, you can test reserve manually:
-- (Replace UUIDs with actual values from queries above)
-- SELECT fn_reserve_stock(
--     'your-warehouse-uuid'::uuid,
--     'your-product-uuid'::uuid,
--     5,
--     'test-order-123',
--     'your-user-uuid'::uuid
-- );
