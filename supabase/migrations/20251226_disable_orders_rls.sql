-- EMERGENCY DEBUG: DISABLE RLS ON ORDERS
-- Run this in Supabase SQL Editor

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Verify data
SELECT count(*) as total_orders FROM orders;
