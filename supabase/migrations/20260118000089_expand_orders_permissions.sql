-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing/potential conflicting policies to ensure idempotency
DROP POLICY IF EXISTS "orders_allow_all" ON orders;
DROP POLICY IF EXISTS "order_items_allow_all" ON order_items;

DROP POLICY IF EXISTS "admin_orders_all" ON orders;
DROP POLICY IF EXISTS "admin_order_items_all" ON order_items;

DROP POLICY IF EXISTS "accountant_orders_all" ON orders;
DROP POLICY IF EXISTS "accountant_order_items_all" ON order_items;

DROP POLICY IF EXISTS "warehouse_orders_select" ON orders;
DROP POLICY IF EXISTS "warehouse_order_items_select" ON order_items;

DROP POLICY IF EXISTS "sale_admin_orders_select" ON orders;
DROP POLICY IF EXISTS "sale_admin_order_items_select" ON order_items;

DROP POLICY IF EXISTS "telesales_own_orders" ON orders;

-- 1. ADMIN Permissions (Full Access)
CREATE POLICY "admin_orders_all" ON orders
FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

CREATE POLICY "admin_order_items_all" ON order_items
FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 2. ACCOUNTANT Permissions (Full Access like Admin)
CREATE POLICY "accountant_orders_all" ON orders
FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'accountant')
);

CREATE POLICY "accountant_order_items_all" ON order_items
FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'accountant')
);

-- 3. WAREHOUSE Permissions (Read Only)
CREATE POLICY "warehouse_orders_select" ON orders
FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'warehouse')
);

CREATE POLICY "warehouse_order_items_select" ON order_items
FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'warehouse')
);

-- 4. SALES ADMIN Permissions (Read Only)
CREATE POLICY "sale_admin_orders_select" ON orders
FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'sale_admin')
);

CREATE POLICY "sale_admin_order_items_select" ON order_items
FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'sale_admin')
);

-- 5. TELESALES (Own orders or specific logic)
CREATE POLICY "telesales_own_orders" ON orders
FOR ALL USING (
  telesales_user_id = auth.uid() 
  OR 
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('telesales', 'admin', 'accountant'))
); 
