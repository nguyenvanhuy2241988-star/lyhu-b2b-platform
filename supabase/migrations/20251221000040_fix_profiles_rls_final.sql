-- FIX: PROFILES PUBLIC ACCESS (V6)
-- Current Issue: "Cuộc hội thoại" appears instead of names, likely because current user cannot SELECT 'profiles' of other users.
-- Solution: Ensure 'profiles' table is publicly readable by all authenticated users.

BEGIN;

-- 1. DROP potential conflicting policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 2. CREATE A WIDE OPEN SELECT POLICY for authenticated users
CREATE POLICY "Allow authenticated users to view all profiles"
    ON public.profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 3. Ensure INSERT/UPDATE (Self only) - Optional but good practice to keep
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

COMMIT;
