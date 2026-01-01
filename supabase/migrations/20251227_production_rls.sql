-- FIXED RLS POLICIES - Using profiles table for role check
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. ORDERS TABLE
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_allow_all" ON orders;
DROP POLICY IF EXISTS "admin_full_access_orders" ON orders;
DROP POLICY IF EXISTS "telesales_own_orders" ON orders;

-- Admin can do everything (check profiles table)
CREATE POLICY "admin_full_access_orders" ON orders
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Telesales can only see/edit their own orders
CREATE POLICY "telesales_own_orders" ON orders
    FOR ALL TO authenticated
    USING (telesales_user_id = auth.uid())
    WITH CHECK (telesales_user_id = auth.uid());

-- =====================================================
-- 2. ORDER_ITEMS TABLE
-- =====================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_allow_all" ON order_items;
DROP POLICY IF EXISTS "admin_full_access_order_items" ON order_items;
DROP POLICY IF EXISTS "telesales_own_order_items" ON order_items;

-- Full access for admin
CREATE POLICY "admin_full_access_order_items" ON order_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Telesales can access items of their orders
CREATE POLICY "telesales_own_order_items" ON order_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.telesales_user_id = auth.uid()
        )
    );

-- =====================================================
-- 3. INVENTORY_LEVELS TABLE
-- =====================================================
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_allow_all" ON inventory_levels;
DROP POLICY IF EXISTS "read_inventory" ON inventory_levels;
DROP POLICY IF EXISTS "admin_modify_inventory" ON inventory_levels;

-- Everyone authenticated can read inventory
CREATE POLICY "read_inventory" ON inventory_levels
    FOR SELECT TO authenticated
    USING (true);

-- Only admin/warehouse can modify inventory
CREATE POLICY "admin_modify_inventory" ON inventory_levels
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'warehouse')
        )
    );

-- =====================================================
-- 4. INVENTORY_TRANSACTIONS TABLE  
-- =====================================================
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_allow_all" ON inventory_transactions;
DROP POLICY IF EXISTS "read_transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "insert_transactions" ON inventory_transactions;

-- Everyone can read transactions
CREATE POLICY "read_transactions" ON inventory_transactions
    FOR SELECT TO authenticated
    USING (true);

-- Everyone can insert (needed for RPC functions)
CREATE POLICY "insert_transactions" ON inventory_transactions
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- =====================================================
-- 5. WAREHOUSES TABLE
-- =====================================================
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "warehouses_allow_all" ON warehouses;
DROP POLICY IF EXISTS "read_warehouses" ON warehouses;
DROP POLICY IF EXISTS "admin_modify_warehouses" ON warehouses;

-- Everyone can read warehouses
CREATE POLICY "read_warehouses" ON warehouses
    FOR SELECT TO authenticated
    USING (true);

-- Only admin can modify
CREATE POLICY "admin_modify_warehouses" ON warehouses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

SELECT 'RLS policies applied using profiles table!' as status;
