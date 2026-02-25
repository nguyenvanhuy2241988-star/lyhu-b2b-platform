-- Fix RLS for Orders and Order Items
-- Run this in Supabase SQL Editor

-- Enable RLS (if not already)
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "orders_allow_all" ON orders;
DROP POLICY IF EXISTS "order_items_allow_all" ON order_items;
-- Drop potentially named policies from old migrations
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON order_items;


-- Create Permissive Policies (Testing Phase)
drop policy if exists "orders_allow_all" on orders;
CREATE POLICY "orders_allow_all" ON orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

drop policy if exists "order_items_allow_all" on order_items;
CREATE POLICY "order_items_allow_all" ON order_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

SELECT 'Fixed RLS for Orders and Order Items' as status;
