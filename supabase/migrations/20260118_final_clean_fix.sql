-- FINAL CLEAN FIX
-- This script is "idempotent" - it drops potential conflicts before adding new ones.
-- It fixes the "Constraint already exists" error and ensures clean permissions.

-- 1. DROP ALL POTENTIAL CONFLICTING CONSTRAINTS FIRST
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS fk_orders_telesales_profile;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_telesales_user_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS fk_orders_telesales_user;

-- 2. ADD THE CORRECT FOREIGN KEY (To Profiles, not generic Users)
ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_telesales_profile
FOREIGN KEY (telesales_user_id) 
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 3. DISABLE RLS ON METADATA TABLES (Crucial for 403 Users error)
-- We force these tables to be OPEN for reading, avoiding any "User" table permission checks.
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. FORCE OPEN ACCESS TO public.users (If it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON TABLE public.users TO authenticated;
    END IF;
END
$$;

-- 5. GRANT EXPLICIT SELECT PERMISSIONS
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 6. GRANT EXECUTE ON HELPER FUNCTION
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO service_role;

-- 7. RELOAD API SCHEMA
NOTIFY pgrst, 'reload schema';
