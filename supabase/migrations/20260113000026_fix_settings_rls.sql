-- 1. Ensure at least one row exists in app_settings
INSERT INTO public.app_settings (company_info, automation_config)
SELECT '{}'::jsonb, '{"auto_assign_leads": false, "email_automation_enabled": false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

-- 2. Update RLS Policy
-- Drop restrictive policy if exists
DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins and Marketing can update app settings" ON public.app_settings;

-- Create new policy allowing Marketing to update
CREATE POLICY "Admins and Marketing can update app settings" ON public.app_settings
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'marketing', 'sale_admin')
        )
    );
