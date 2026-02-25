-- EXPLICIT FK DROP AND PERMISSIONS FIX
-- This script hard-codes the constraint names to ensure they are dropped.

-- 1. DROP POSSIBLE FOREIGN KEYS (Try all common names)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_telesales_user_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS fk_orders_telesales_user;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_telesales_user_id_fkey1;

-- 2. ADD FK TO PROFILES (Safe Table)
-- Ensure we point to public.profiles, NOT auth.users
ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_telesales_profile
FOREIGN KEY (telesales_user_id) 
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 3. DISABLE RLS ON REFERENCE TABLES (Force Open Access)
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. GRANT READ ACCESS (Just in case)
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 5. FUNCTION PERMISSIONS
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO anon;

-- 6. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
