-- Fix: Enable RLS on tables flagged by Security Advisor
-- and ensure Authenticated users can still READ them (prevent 403 errors).

BEGIN;

-- 1. CUSTOMERS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_read_policy" ON public.customers;
CREATE POLICY "customers_read_policy" ON public.customers FOR SELECT TO authenticated USING (true);

-- 2. INVENTORY_LEVELS
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_levels_read_policy" ON public.inventory_levels;
CREATE POLICY "inventory_levels_read_policy" ON public.inventory_levels FOR SELECT TO authenticated USING (true);

-- 3. INVENTORY_TRANSACTIONS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_transactions_read_policy" ON public.inventory_transactions;
CREATE POLICY "inventory_transactions_read_policy" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);

-- 4. PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_read_policy" ON public.products;
CREATE POLICY "products_read_policy" ON public.products FOR SELECT TO authenticated USING (true);

-- 5. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
CREATE POLICY "profiles_read_policy" ON public.profiles FOR SELECT TO authenticated USING (true);
-- Optional: Allow users to update their own profile (if they couldn't before)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 6. WAREHOUSES
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouses_read_policy" ON public.warehouses;
CREATE POLICY "warehouses_read_policy" ON public.warehouses FOR SELECT TO authenticated USING (true);

COMMIT;
