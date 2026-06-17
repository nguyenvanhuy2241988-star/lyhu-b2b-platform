-- 1. Create table for Affiliate Partners CRM
CREATE TABLE IF NOT EXISTS public.affiliate_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hr_in_charge UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT null,
    type TEXT CHECK (type IN ('CTV', 'KOL', 'KOC')),
    platform TEXT, -- e.g., Facebook, TikTok, Shopee
    profile_link TEXT,
    phone TEXT,
    email TEXT,
    zalo TEXT,
    collaboration_types JSONB DEFAULT '[]'::JSONB, -- Array of ['VIDEO', 'PRODUCT', 'MONEY']
    status TEXT DEFAULT 'LEAD', -- e.g., LEAD, CONTACTED, NEGOTIATING, WON, LOST
    notes TEXT,
    evidence_images JSONB DEFAULT '[]'::JSONB, -- Array of image URLs
    performance_metrics JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;

-- Policies for affiliate_partners
-- Admin/HR Manager can see all
CREATE POLICY "Admin and HR Manager can view all affiliate partners"
ON public.affiliate_partners FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'hr_manager', 'manager')
    )
    OR hr_in_charge = auth.uid()
);

CREATE POLICY "Users can insert affiliate partners"
ON public.affiliate_partners FOR INSERT
WITH CHECK (
    hr_in_charge = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr_manager', 'recruiter'))
);

CREATE POLICY "Users can update affiliate partners"
ON public.affiliate_partners FOR UPDATE
USING (
    hr_in_charge = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr_manager', 'manager'))
);

CREATE POLICY "Admin can delete affiliate partners"
ON public.affiliate_partners FOR DELETE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr_manager', 'manager'))
);

-- 2. Create table for Affiliate KPI Settings
CREATE TABLE IF NOT EXISTS public.affiliate_kpi_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    found_target INTEGER DEFAULT 50,
    contacted_target INTEGER DEFAULT 30,
    won_target INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.affiliate_kpi_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view affiliate kpi settings"
ON public.affiliate_kpi_settings FOR SELECT
USING (true);

CREATE POLICY "Admin can manage affiliate kpi settings"
ON public.affiliate_kpi_settings FOR ALL
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr_manager', 'manager'))
);

-- 3. Create table for Affiliate Daily Activities (KPI Tracking)
CREATE TABLE IF NOT EXISTS public.affiliate_daily_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    
    found_actual INTEGER DEFAULT 0,
    contacted_actual INTEGER DEFAULT 0,
    won_actual INTEGER DEFAULT 0,
    lost_actual INTEGER DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

ALTER TABLE public.affiliate_daily_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view affiliate daily activities"
ON public.affiliate_daily_activities FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr_manager', 'manager', 'sale_admin'))
);

CREATE POLICY "Users can insert their own daily activities"
ON public.affiliate_daily_activities FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own daily activities"
ON public.affiliate_daily_activities FOR UPDATE
USING (user_id = auth.uid());

-- Function to handle UPSERT on affiliate_daily_activities when a partner changes status
CREATE OR REPLACE FUNCTION handle_affiliate_partner_status_change()
RETURNS TRIGGER AS $$
DECLARE
    today DATE := CURRENT_DATE;
BEGIN
    -- If INSERT (New Partner added)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.affiliate_daily_activities (user_id, date, found_actual, updated_at)
        VALUES (NEW.hr_in_charge, today, 1, NOW())
        ON CONFLICT (user_id, date)
        DO UPDATE SET 
            found_actual = affiliate_daily_activities.found_actual + 1,
            updated_at = NOW();
    END IF;

    -- If UPDATE (Status changed)
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        -- Only track changes that happen on the current day for the 'actual' metrics
        -- Track contacted
        IF NEW.status = 'CONTACTED' OR NEW.status = 'NEGOTIATING' THEN
            -- Only count as contacted if it wasn't already contacted/beyond
            IF OLD.status = 'LEAD' THEN
                INSERT INTO public.affiliate_daily_activities (user_id, date, contacted_actual, updated_at)
                VALUES (NEW.hr_in_charge, today, 1, NOW())
                ON CONFLICT (user_id, date)
                DO UPDATE SET 
                    contacted_actual = affiliate_daily_activities.contacted_actual + 1,
                    updated_at = NOW();
            END IF;
        END IF;

        -- Track won
        IF NEW.status = 'WON' THEN
            INSERT INTO public.affiliate_daily_activities (user_id, date, won_actual, updated_at)
            VALUES (NEW.hr_in_charge, today, 1, NOW())
            ON CONFLICT (user_id, date)
            DO UPDATE SET 
                won_actual = affiliate_daily_activities.won_actual + 1,
                updated_at = NOW();
        END IF;

        -- Track lost
        IF NEW.status = 'LOST' THEN
            INSERT INTO public.affiliate_daily_activities (user_id, date, lost_actual, updated_at)
            VALUES (NEW.hr_in_charge, today, 1, NOW())
            ON CONFLICT (user_id, date)
            DO UPDATE SET 
                lost_actual = affiliate_daily_activities.lost_actual + 1,
                updated_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_affiliate_partner_status_change ON public.affiliate_partners;
CREATE TRIGGER trg_affiliate_partner_status_change
AFTER INSERT OR UPDATE OF status ON public.affiliate_partners
FOR EACH ROW
EXECUTE FUNCTION handle_affiliate_partner_status_change();
