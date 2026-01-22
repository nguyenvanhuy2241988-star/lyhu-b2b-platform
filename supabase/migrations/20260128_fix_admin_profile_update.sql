-- Fix: Allow Admins to update ANY profile
-- Currently only "profiles_update_own" exists.

BEGIN;

-- 1. Create a helper function to check if current user is admin (if not exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Policy for Admins to Update Any Profile
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

CREATE POLICY "profiles_update_admin" ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.is_admin() OR auth.uid() = id
)
WITH CHECK (
  public.is_admin() OR auth.uid() = id
);

-- 3. Also allow INSERT for Admins (if creating new profiles manually via UI later)
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin" ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
);

COMMIT;
