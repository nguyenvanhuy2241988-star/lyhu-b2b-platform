-- 1. Add automation_config to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS automation_config JSONB DEFAULT '{"auto_assign_leads": false}'::jsonb;

-- 2. Update the Round Robin function to check the setting
CREATE OR REPLACE FUNCTION public.assign_lead_round_robin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    selected_user_id UUID;
    is_auto_assign_enabled BOOLEAN;
BEGIN
    -- Check if feature is enabled in app_settings
    -- We assume there is only one row in app_settings, or we take the first one
    SELECT (automation_config->>'auto_assign_leads')::boolean 
    INTO is_auto_assign_enabled
    FROM public.app_settings
    LIMIT 1;

    -- Default to false if config not found
    IF is_auto_assign_enabled IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    -- Only assign if owner_user_id is NULL
    IF NEW.owner_user_id IS NULL THEN
        
        -- Find the user with role 'telesales' or 'sales' 
        -- who has the OLDEST 'last assigned deal' (or no deals at all)
        SELECT id INTO selected_user_id
        FROM public.profiles
        WHERE role IN ('telesales', 'sales')
        ORDER BY (
            SELECT MAX(created_at) 
            FROM public.crm_deals 
            WHERE owner_user_id = profiles.id
        ) ASC NULLS FIRST
        LIMIT 1;

        -- If we found someone, assign them
        IF selected_user_id IS NOT NULL THEN
            NEW.owner_user_id := selected_user_id;
        END IF;
        
    END IF;

    RETURN NEW;
END;
$$;
