-- =====================================================
-- AI Poster Studio: brand_profiles table
-- Lưu thông tin thương hiệu cho 5 page Facebook
-- =====================================================

CREATE TABLE IF NOT EXISTS brand_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    page_id TEXT,                          -- Facebook page ID (optional)
    brand_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#2196F3',
    secondary_color TEXT DEFAULT '#FF9800',
    industry TEXT DEFAULT '',
    style_keywords TEXT DEFAULT 'modern, professional',
    default_instructions TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);

-- RLS
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- User can manage their own brands
CREATE POLICY "Users can manage own brands" ON brand_profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin can see all brands
CREATE POLICY "Admin can see all brands" ON brand_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_brand_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brand_profiles_updated_at
    BEFORE UPDATE ON brand_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_profiles_updated_at();
