-- Fix permissions for related tables (Customers, Products, Profiles) to support Orders module
-- Run this in Supabase SQL Editor

-- 1. CUSTOMERS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop potential conflicting policies (if any specific ones exist preventing staff access)
-- check if specific policies exist, usually good to just add a permissive one
-- Policy: Staff can read all customers
DROP POLICY IF EXISTS "staff_read_customers" ON customers;
CREATE POLICY "staff_read_customers" ON customers
FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'accountant', 'sale_admin', 'warehouse', 'telesales', 'marketing'))
);

-- 2. PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_products" ON products;
CREATE POLICY "staff_read_products" ON products
FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'accountant', 'sale_admin', 'warehouse', 'telesales', 'marketing', 'ctv', 'ecommerce'))
);

-- 3. PROFILES
-- Existing policy usually restricts to own profile. We need staff to see other profiles (e.g., telesales user name)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_all_profiles" ON profiles;
CREATE POLICY "staff_read_all_profiles" ON profiles
FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'accountant', 'sale_admin', 'warehouse', 'telesales', 'marketing'))
);

-- 4. PUBLIC.USERS (Handle "permission denied for table users" error)
-- If there is a public.users table acting as a mirror or legacy.
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "staff_read_users" ON public.users;
        EXECUTE 'CREATE POLICY "staff_read_users" ON public.users FOR SELECT USING (exists (select 1 from profiles where id = auth.uid() and role in (''admin'', ''accountant'', ''sale_admin'', ''warehouse'', ''telesales'')))';
    END IF;
END
$$;
