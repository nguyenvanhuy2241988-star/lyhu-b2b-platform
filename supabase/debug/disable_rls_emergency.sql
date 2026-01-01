-- EMERGENCY: Temporarily disable RLS to restore access
-- Run this if orders are not visible

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled - all data visible again' as status;
