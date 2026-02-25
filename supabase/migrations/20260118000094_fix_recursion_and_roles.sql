-- Fix Infinite Recursion in RLS Policies
-- We must use a SECURITY DEFINER function to check roles to avoid the policy querying the table it protects.

-- 1. Create Helper Function (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN _role;
END;
$$;

-- 2. Fix PROFILES Policy (The source of the recursion)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_all_profiles" ON profiles;
CREATE POLICY "staff_read_all_profiles" ON profiles
FOR SELECT USING (
  get_current_user_role() IN ('admin', 'accountant', 'sale_admin', 'warehouse', 'telesales', 'marketing', 'shipper', 'rnd', 'ecommerce', 'recruiter')
  OR id = auth.uid() -- Always allow reading own profile
);

-- 3. Fix CUSTOMERS Policy
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_customers" ON customers;
CREATE POLICY "staff_read_customers" ON customers
FOR SELECT USING (
  get_current_user_role() IN ('admin', 'accountant', 'sale_admin', 'warehouse', 'telesales', 'marketing', 'shipper', 'rnd', 'ecommerce')
);

-- 4. Fix PRODUCTS Policy
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_products" ON products;
CREATE POLICY "staff_read_products" ON products
FOR SELECT USING (
  get_current_user_role() IN ('admin', 'accountant', 'sale_admin', 'warehouse', 'telesales', 'marketing', 'ctv', 'ecommerce', 'shipper', 'rnd')
);

-- 5. Fix ORDERS Policies (Update to use function for cleaner/safer checks)
-- We can leave the existing 'exists' checks if they don't cause recursion (orders checking profiles is fine, unless profiles check orders),
-- But for consistency and performance, let's update them too.

DROP POLICY IF EXISTS "admin_orders_all" ON orders;
CREATE POLICY "admin_orders_all" ON orders FOR ALL USING ( get_current_user_role() = 'admin' );

DROP POLICY IF EXISTS "admin_order_items_all" ON order_items;
CREATE POLICY "admin_order_items_all" ON order_items FOR ALL USING ( get_current_user_role() = 'admin' );

DROP POLICY IF EXISTS "accountant_orders_all" ON orders;
CREATE POLICY "accountant_orders_all" ON orders FOR ALL USING ( get_current_user_role() = 'accountant' );

DROP POLICY IF EXISTS "accountant_order_items_all" ON order_items;
CREATE POLICY "accountant_order_items_all" ON order_items FOR ALL USING ( get_current_user_role() = 'accountant' );

DROP POLICY IF EXISTS "warehouse_orders_select" ON orders;
CREATE POLICY "warehouse_orders_select" ON orders FOR SELECT USING ( get_current_user_role() = 'warehouse' );

DROP POLICY IF EXISTS "warehouse_order_items_select" ON order_items;
CREATE POLICY "warehouse_order_items_select" ON order_items FOR SELECT USING ( get_current_user_role() = 'warehouse' );

DROP POLICY IF EXISTS "sale_admin_orders_select" ON orders;
CREATE POLICY "sale_admin_orders_select" ON orders FOR SELECT USING ( get_current_user_role() = 'sale_admin' );

DROP POLICY IF EXISTS "sale_admin_order_items_select" ON order_items;
CREATE POLICY "sale_admin_order_items_select" ON order_items FOR SELECT USING ( get_current_user_role() = 'sale_admin' );

-- 5b. TELESALES (Review logic)
DROP POLICY IF EXISTS "telesales_own_orders" ON orders;
CREATE POLICY "telesales_own_orders" ON orders
FOR ALL USING (
  telesales_user_id = auth.uid() 
  OR 
  get_current_user_role() IN ('telesales', 'admin', 'accountant')
);
