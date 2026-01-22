-- Migration: Finalize CRM Permissions & Fix 403 Errors
-- Date: 2026-01-30

BEGIN;

-- 1. Ensure `app_settings` RLS is correct
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update app_settings" ON public.app_settings;

CREATE POLICY "Authenticated users can view app_settings" ON public.app_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update app_settings" ON public.app_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- 2. Ensure `crm_settings` RLS is correct (for Banner)
ALTER TABLE IF EXISTS public.crm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view crm_settings" ON public.crm_settings;
DROP POLICY IF EXISTS "Admins can update crm_settings" ON public.crm_settings;

CREATE POLICY "Authenticated users can view crm_settings" ON public.crm_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update crm_settings" ON public.crm_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- 3. Ensure Storage Bucket for CRM/HR assets is public/readable
-- Note: Cannot do this easily in SQL standard migrations without pg_net or triggers, 
-- but we assume 'hr-assets' exists. 
-- We can add a policy for objects if needed, but usually handled via dashboard.

-- 4. Fix RPC Permissions (Ensure they are executable)
GRANT EXECUTE ON FUNCTION public.update_crm_columns(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_crm_columns(jsonb) TO anon;

-- 5. Drop old/conflicting RPCs if they exist to prevent confusion
DROP FUNCTION IF EXISTS public.fetch_kanban_settings();

COMMIT;
