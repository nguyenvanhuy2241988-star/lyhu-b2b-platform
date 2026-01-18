-- ULTIMATE PERMISSIONS FIX
-- Grants explicit SELECT/EXECUTE permissions to unblock 403 errors.
-- Run this in Supabase SQL Editor

-- 1. Grant USAGE on Schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Grant SELECT on All Public Tables (Fail-safe for 403 errors)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Handle public.users explicitly (The source of "permission denied for table users")
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Make sure it's accessible
        GRANT SELECT ON TABLE public.users TO authenticated;
        
        -- Reset RLS to be permissive for reading (Authenticated users can read strict tables)
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "allow_select_users" ON public.users;
        -- Simple policy: Authenticated users can read valid users
        CREATE POLICY "allow_select_users" ON public.users FOR SELECT TO authenticated USING (true);
    END IF;
END
$$;

-- 4. Fix PROFILES (Ensure readable)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);

-- 5. Fix CUSTOMERS & PRODUCTS (Ensure readable)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_read_all" ON public.customers;
CREATE POLICY "customers_read_all" ON public.customers FOR SELECT TO authenticated USING (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_read_all" ON public.products;
CREATE POLICY "products_read_all" ON public.products FOR SELECT TO authenticated USING (true);

-- 6. Grant EXECUTE on Helper Function (Critical for Role Checks)
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO service_role;

-- 7. Sync Profiles (One last time to ensure no NULL roles)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'telesales' 
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- 8. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
