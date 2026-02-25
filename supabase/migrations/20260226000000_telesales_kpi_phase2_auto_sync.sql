-- 1. Create Evidence Logs Table for Telesales
CREATE TABLE IF NOT EXISTS public.telesales_post_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    platform TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    group_name TEXT,
    group_link TEXT,
    post_link TEXT NOT NULL,
    image_url TEXT,
    group_note TEXT,
    content_excerpt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Evidence Logs
ALTER TABLE public.telesales_post_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own telesales_post_logs" ON public.telesales_post_logs;
CREATE POLICY "Users can view own telesales_post_logs" 
ON public.telesales_post_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own telesales_post_logs" ON public.telesales_post_logs;
CREATE POLICY "Users can insert own telesales_post_logs" 
ON public.telesales_post_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own telesales_post_logs" ON public.telesales_post_logs;
CREATE POLICY "Users can update own telesales_post_logs" 
ON public.telesales_post_logs FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own telesales_post_logs" ON public.telesales_post_logs;
CREATE POLICY "Users can delete own telesales_post_logs" 
ON public.telesales_post_logs FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all telesales_post_logs" ON public.telesales_post_logs;
CREATE POLICY "Admins can view all telesales_post_logs"
ON public.telesales_post_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'manager', 'telesales_manager', 'sale_admin')
    )
);

-- Create index for faster querying by user and date
DROP INDEX IF EXISTS idx_telesales_post_logs_user_date;
CREATE INDEX idx_telesales_post_logs_user_date ON public.telesales_post_logs(user_id, report_date);

-- 2. Trigger Function: Auto-sync Calls to Daily KPI
CREATE OR REPLACE FUNCTION public.fn_auto_sync_telesales_calls()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for 'call' type activity
    IF NEW.type = 'call' THEN
        INSERT INTO public.telesales_daily_activities (user_id, report_date, calls_completed)
        VALUES (NEW.user_id, COALESCE(NEW.created_at::DATE, CURRENT_DATE), 1)
        ON CONFLICT (user_id, report_date) 
        DO UPDATE SET calls_completed = COALESCE(telesales_daily_activities.calls_completed, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map Trigger to crm_activities
DROP TRIGGER IF EXISTS trg_auto_sync_telesales_calls ON public.crm_activities;
CREATE TRIGGER trg_auto_sync_telesales_calls
AFTER INSERT ON public.crm_activities
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_sync_telesales_calls();

-- 3. Trigger Function: Auto-sync Self Sourced Data (Data mới)
CREATE OR REPLACE FUNCTION public.fn_auto_sync_self_sourced_data()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Count only if source is SELF_FOUND
        IF NEW.source_category = 'SELF_FOUND' THEN
            INSERT INTO public.telesales_daily_activities (user_id, report_date, self_sourced_data)
            VALUES (NEW.owner_user_id, COALESCE(NEW.created_at::DATE, CURRENT_DATE), 1)
            ON CONFLICT (user_id, report_date) 
            DO UPDATE SET self_sourced_data = COALESCE(telesales_daily_activities.self_sourced_data, 0) + 1;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Changed to SELF_FOUND (Increment)
        IF COALESCE(OLD.source_category, '') != 'SELF_FOUND' AND COALESCE(NEW.source_category, '') = 'SELF_FOUND' THEN
            INSERT INTO public.telesales_daily_activities (user_id, report_date, self_sourced_data)
            VALUES (NEW.owner_user_id, COALESCE(NEW.created_at::DATE, CURRENT_DATE), 1)
            ON CONFLICT (user_id, report_date) 
            DO UPDATE SET self_sourced_data = COALESCE(telesales_daily_activities.self_sourced_data, 0) + 1;
        END IF;
        
        -- Changed from SELF_FOUND to something else (Decrement)
        IF COALESCE(OLD.source_category, '') = 'SELF_FOUND' AND COALESCE(NEW.source_category, '') != 'SELF_FOUND' THEN
            UPDATE public.telesales_daily_activities
            SET self_sourced_data = GREATEST(COALESCE(self_sourced_data, 0) - 1, 0)
            WHERE user_id = NEW.owner_user_id AND report_date = COALESCE(NEW.created_at::DATE, CURRENT_DATE);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map Trigger to crm_deals
DROP TRIGGER IF EXISTS trg_auto_sync_self_sourced_data ON public.crm_deals;
CREATE TRIGGER trg_auto_sync_self_sourced_data
AFTER INSERT OR UPDATE ON public.crm_deals
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_sync_self_sourced_data();
