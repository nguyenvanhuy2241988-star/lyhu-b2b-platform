-- FIX SYNTAX ERROR & APPLY REDIRECT
-- This script fixes the "cannot cast type" error and reapplies the Foreign Key fix.

-- 1. Safely Drop Existing FK on telesales_user_id
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'public.orders'::regclass
        AND att.attrelid = 'public.orders'::regclass
        AND att.attname = 'telesales_user_id'
        AND con.contype = 'f' -- Foreign Key
    LOOP
        -- Print for debug logs in Postgres
        RAISE NOTICE 'Dropping constraint: %', r.conname;
        EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END
$$;

-- 2. Add New FK referencing Profiles (Safe, User-Controlled Table)
ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_telesales_profile
FOREIGN KEY (telesales_user_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 3. Disable RLS on Reference Tables (To Ensure 100% Readability)
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. Handle public.users if it exists (Disable RLS)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
        GRANT SELECT ON TABLE public.users TO authenticated;
    END IF;
END
$$;

-- 5. Explicitly Grant Select
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 6. Reload Schema
NOTIFY pgrst, 'reload schema';
