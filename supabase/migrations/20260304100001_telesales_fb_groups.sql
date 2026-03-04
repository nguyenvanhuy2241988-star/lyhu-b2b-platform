-- ===========================================
-- Create telesales_fb_groups table
-- For managing Facebook groups used by telesales team
-- ===========================================

CREATE TABLE IF NOT EXISTS telesales_fb_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,                                -- Tên nhóm
    link TEXT,                                         -- Link Facebook group
    platform TEXT DEFAULT 'facebook_group',             -- facebook_group / facebook_page / zalo
    category TEXT DEFAULT 'other',                      -- food_market, distributor, spice_seasoning, horeca, farm_product, local_community, b2b_wholesale, other
    status TEXT DEFAULT 'active',                       -- active / archived / banned
    quality_rating INTEGER DEFAULT 0,                   -- Đánh giá chất lượng 1-5 sao (0 = chưa đánh giá)
    best_post_time TEXT,                                -- Khung giờ đăng bài hiệu quả (VD: "8h-10h sáng")
    member_count INTEGER DEFAULT 0,                     -- Ước tính số thành viên
    notes TEXT,                                         -- Ghi chú (quy tắc, admin, giờ vàng...)
    added_by UUID REFERENCES auth.users(id),            -- Người thêm
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE telesales_fb_groups ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view groups
CREATE POLICY "select_fb_groups" ON telesales_fb_groups
    FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert
CREATE POLICY "insert_fb_groups" ON telesales_fb_groups
    FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "update_fb_groups" ON telesales_fb_groups
    FOR UPDATE TO authenticated USING (true);

-- Authenticated users can delete
CREATE POLICY "delete_fb_groups" ON telesales_fb_groups
    FOR DELETE TO authenticated USING (true);

-- Indexes for filtering
CREATE INDEX idx_fb_groups_category ON telesales_fb_groups(category);
CREATE INDEX idx_fb_groups_status ON telesales_fb_groups(status);
CREATE INDEX idx_fb_groups_platform ON telesales_fb_groups(platform);
CREATE INDEX idx_fb_groups_name ON telesales_fb_groups(name);

-- Unique constraint on name + link to prevent duplicates
CREATE UNIQUE INDEX idx_fb_groups_unique_name ON telesales_fb_groups(name) WHERE name IS NOT NULL;
