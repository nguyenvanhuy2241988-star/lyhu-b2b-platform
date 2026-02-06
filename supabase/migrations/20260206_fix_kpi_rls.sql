-- FIX RLS for KPI Settings using Security Definer to bypass profiles RLS issues

-- 1. Create a helper function to check admin role safely
CREATE OR REPLACE FUNCTION public.check_recruitment_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges, bypassing RLS on profiles
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager', 'recruiter_manager')
  );
END;
$$;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own KPI settings" ON public.recruitment_kpi_settings;
DROP POLICY IF EXISTS "Admins can view all KPI settings" ON public.recruitment_kpi_settings;
DROP POLICY IF EXISTS "Users can insert own KPI settings" ON public.recruitment_kpi_settings;
DROP POLICY IF EXISTS "Admins can update KPI settings" ON public.recruitment_kpi_settings;
DROP POLICY IF EXISTS "Admins can delete KPI settings" ON public.recruitment_kpi_settings;

-- 3. Create simplified policies

-- Allow Admins to do EVERYTHING (Select, Insert, Update, Delete)
CREATE POLICY "Admins can manage all KPI settings" ON public.recruitment_kpi_settings
    FOR ALL
    USING (public.check_recruitment_admin());

-- Allow Users to VIEW their own settings
CREATE POLICY "Users can view own KPI settings" ON public.recruitment_kpi_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow Users to INSERT their own settings (if not exists)
-- (We might restrict UPDATE to admins only, which is covered because this is only FOR INSERT)
CREATE POLICY "Users can insert own KPI settings" ON public.recruitment_kpi_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
