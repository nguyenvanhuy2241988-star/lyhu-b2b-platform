-- ============================================
-- Lead Distribution System
-- Tables: marketing_leads, lead_distribution_config
-- ============================================

-- 1. Marketing Leads — stores all phone leads from Messenger 
CREATE TABLE IF NOT EXISTS marketing_leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES social_conversations(id) ON DELETE SET NULL,
    customer_name text,
    customer_phone text NOT NULL,
    customer_avatar text,
    region text,
    source text DEFAULT 'facebook_messenger',
    page_name text,
    page_id uuid REFERENCES facebook_pages(id) ON DELETE SET NULL,
    ad_id text,
    first_message text,
    assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at timestamptz,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'rejected')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON marketing_leads(status);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_assigned_to ON marketing_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_phone ON marketing_leads(customer_phone);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_conversation ON marketing_leads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_created ON marketing_leads(created_at DESC);

-- Prevent duplicate leads from same conversation
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_leads_unique_conv 
    ON marketing_leads(conversation_id) WHERE conversation_id IS NOT NULL;

-- 2. Lead Distribution Config — settings for auto-assignment
CREATE TABLE IF NOT EXISTS lead_distribution_config (
    id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
    enabled boolean DEFAULT true,
    eligible_user_ids uuid[] DEFAULT '{}',
    only_online boolean DEFAULT true,
    fallback_delay_minutes int DEFAULT 5,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Insert default config
INSERT INTO lead_distribution_config (id, enabled, eligible_user_ids, only_online, fallback_delay_minutes)
VALUES (1, true, '{}', true, 5)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policies
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_distribution_config ENABLE ROW LEVEL SECURITY;

-- Marketing leads: marketing + admin can see all, telesales can see their own
CREATE POLICY "marketing_leads_select_admin" ON marketing_leads
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'marketing', 'sale_admin'))
    );

CREATE POLICY "marketing_leads_select_own" ON marketing_leads
    FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "marketing_leads_insert" ON marketing_leads
    FOR INSERT WITH CHECK (true); -- webhook uses service role

CREATE POLICY "marketing_leads_update_admin" ON marketing_leads
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'marketing', 'sale_admin'))
    );

-- Config: admin + marketing can read/write
CREATE POLICY "lead_config_select" ON lead_distribution_config
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'marketing', 'sale_admin'))
    );

CREATE POLICY "lead_config_update" ON lead_distribution_config
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'marketing'))
    );

-- 4. Function to get online eligible telesales
CREATE OR REPLACE FUNCTION get_online_eligible_telesales()
RETURNS TABLE(user_id uuid, full_name text) AS $$
DECLARE
    config_rec lead_distribution_config;
BEGIN
    SELECT * INTO config_rec FROM lead_distribution_config WHERE id = 1;
    
    IF NOT config_rec.enabled THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT p.id, p.full_name
    FROM profiles p
    WHERE p.id = ANY(config_rec.eligible_user_ids)
      AND p.role IN ('telesales', 'sale_admin')
      AND p.status = 'active'
      AND (NOT config_rec.only_online OR p.is_online = true)
    ORDER BY random();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
