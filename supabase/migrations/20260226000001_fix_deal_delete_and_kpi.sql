-- 1. Fix DELETE Policy on crm_deals for Users
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users delete own crm_deals" ON public.crm_deals;
CREATE POLICY "Users delete own crm_deals"
ON public.crm_deals FOR DELETE
USING (owner_user_id = auth.uid());

-- 2. Refined Trigger for Call Activities (using standard EXCLUDED)
CREATE OR REPLACE FUNCTION public.fn_auto_sync_telesales_calls()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'call' AND NEW.user_id IS NOT NULL THEN
            INSERT INTO public.telesales_daily_activities (user_id, report_date, calls_completed)
            VALUES (NEW.user_id, COALESCE(NEW.created_at::DATE, CURRENT_DATE), 1)
            ON CONFLICT (user_id, report_date) 
            DO UPDATE SET calls_completed = COALESCE(telesales_daily_activities.calls_completed, 0) + 1;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'call' AND OLD.user_id IS NOT NULL THEN
            UPDATE public.telesales_daily_activities
            SET calls_completed = GREATEST(COALESCE(calls_completed, 0) - 1, 0)
            WHERE user_id = OLD.user_id AND report_date = COALESCE(OLD.created_at::DATE, CURRENT_DATE);
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Refined Trigger for Deal Source Updates (using standard EXCLUDED)
CREATE OR REPLACE FUNCTION public.fn_auto_sync_self_sourced_data()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.source_category = 'SELF_FOUND' AND NEW.owner_user_id IS NOT NULL THEN
            INSERT INTO public.telesales_daily_activities (user_id, report_date, self_sourced_data)
            VALUES (NEW.owner_user_id, COALESCE(NEW.created_at::DATE, CURRENT_DATE), 1)
            ON CONFLICT (user_id, report_date) 
            DO UPDATE SET self_sourced_data = COALESCE(telesales_daily_activities.self_sourced_data, 0) + 1;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Changed to SELF_FOUND (Increment)
        IF COALESCE(OLD.source_category, '') != 'SELF_FOUND' AND COALESCE(NEW.source_category, '') = 'SELF_FOUND' AND NEW.owner_user_id IS NOT NULL THEN
            INSERT INTO public.telesales_daily_activities (user_id, report_date, self_sourced_data)
            VALUES (NEW.owner_user_id, COALESCE(NEW.created_at::DATE, CURRENT_DATE), 1)
            ON CONFLICT (user_id, report_date) 
            DO UPDATE SET self_sourced_data = COALESCE(telesales_daily_activities.self_sourced_data, 0) + 1;
        END IF;
        
        -- Changed from SELF_FOUND to something else (Decrement)
        IF COALESCE(OLD.source_category, '') = 'SELF_FOUND' AND COALESCE(NEW.source_category, '') != 'SELF_FOUND' AND NEW.owner_user_id IS NOT NULL THEN
            UPDATE public.telesales_daily_activities
            SET self_sourced_data = GREATEST(COALESCE(self_sourced_data, 0) - 1, 0)
            WHERE user_id = NEW.owner_user_id AND report_date = COALESCE(NEW.created_at::DATE, CURRENT_DATE);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.source_category = 'SELF_FOUND' AND OLD.owner_user_id IS NOT NULL THEN
            UPDATE public.telesales_daily_activities
            SET self_sourced_data = GREATEST(COALESCE(self_sourced_data, 0) - 1, 0)
            WHERE user_id = OLD.owner_user_id AND report_date = COALESCE(OLD.created_at::DATE, CURRENT_DATE);
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map Triggers
DROP TRIGGER IF EXISTS trg_auto_sync_telesales_calls ON public.crm_activities;
CREATE TRIGGER trg_auto_sync_telesales_calls
AFTER INSERT OR DELETE ON public.crm_activities
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_sync_telesales_calls();

DROP TRIGGER IF EXISTS trg_auto_sync_self_sourced_data ON public.crm_deals;
CREATE TRIGGER trg_auto_sync_self_sourced_data
AFTER INSERT OR UPDATE OR DELETE ON public.crm_deals
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_sync_self_sourced_data();
