
-- Create social_pages table
CREATE TABLE IF NOT EXISTS social_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE social_pages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON social_pages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for admin/marketing users" ON social_pages
    FOR ALL USING (
        exists (
            select 1 from user_roles
            where user_id = auth.uid()
            and role in ('admin', 'sale_admin', 'marketing')
        )
    );
