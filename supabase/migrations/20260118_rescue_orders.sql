-- RESCUE SCRIPT: Fix Orders Visibility and Permissions
-- Run this in Supabase SQL Editor

-- 1. Ensure all users have a profile (Sync auth.users -> public.profiles)
-- This fixes the issue if the user exists but has no profile row, causing get_current_user_role() to return NULL.
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'telesales' -- Default role, you can change later
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Validate/Reset Admin Role (Ensure YOU are admin)
-- Replace this email with your actual admin email if needed, or rely on existing data
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your_admin_email@example.com';

-- 3. Update Function: Fix Search Path & Permissions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
-- Include 'auth' and 'extensions' in search path to be safe, though fully qualified names are used.
SET search_path = public, auth, extensions
AS $$
DECLARE
  _role text;
BEGIN
  -- Use fully qualified auth.uid() just to be sure
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN _role;
END;
$$;

-- CRITICAL: Grant permission to use this function
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO anon; -- Sometimes needed if initial check happens before full auth

-- 4. Re-apply Policies (Just to be sure they use the updated function)

-- PROFILES
DROP POLICY IF EXISTS "staff_read_all_profiles" ON profiles;
CREATE POLICY "staff_read_all_profiles" ON profiles
FOR SELECT USING (
  get_current_user_role() IN ('admin', 'accountant', 'sale_admin', 'warehouse', 'telesales', 'marketing', 'shipper', 'rnd', 'ecommerce', 'recruiter')
  OR id = auth.uid()
);

-- CUSTOMERS
DROP POLICY IF EXISTS "staff_read_customers" ON customers;
CREATE POLICY "staff_read_customers" ON customers
FOR SELECT USING (
  get_current_user_role() IN ('admin', 'accountant', 'sale_admin', 'warehouse', 'telesales', 'marketing', 'shipper', 'rnd', 'ecommerce')
);

-- PRODUCTS
DROP POLICY IF EXISTS "staff_read_products" ON products;
CREATE POLICY "staff_read_products" ON products
FOR SELECT USING (
  get_current_user_role() IN ('admin', 'accountant', 'sale_admin', 'warehouse', 'telesales', 'marketing', 'ctv', 'ecommerce', 'shipper', 'rnd')
);

-- ORDERS
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

DROP POLICY IF EXISTS "telesales_own_orders" ON orders;
CREATE POLICY "telesales_own_orders" ON orders
FOR ALL USING (
  telesales_user_id = auth.uid() 
  OR 
  get_current_user_role() IN ('telesales', 'admin', 'accountant')
);

-- 5. Notify Schema Reload
NOTIFY pgrst, 'reload schema';
