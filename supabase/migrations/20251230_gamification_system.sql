-- Gamification & Engagement Schema (V4.1)

-- 1. Bonding Fund Tracker
CREATE TABLE IF NOT EXISTS bonding_fund (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    balance BIGINT DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Seed bonding fund if not exists (Single row for collective fund)
INSERT INTO bonding_fund (id, balance) 
VALUES ('00000000-0000-0000-0000-000000000001', 2500000)
ON CONFLICT (id) DO NOTHING;

-- 2. Achievements Definitions
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY, -- e.g. 'master_closer', 'call_warrior'
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT, -- Lucide icon name
    threshold_type TEXT, -- 'conversion_rate', 'calls', 'orders', etc.
    threshold_value NUMERIC,
    color_class TEXT DEFAULT 'text-primary-500',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial achievements
INSERT INTO achievements (id, name, description, icon_name, threshold_type, threshold_value, color_class) VALUES
('master_closer', 'Bậc thầy Chốt đơn', 'Tỉ lệ chốt đơn đạt trên 20%', 'Target', 'conversion_rate', 20, 'text-emerald-500'),
('call_warrior', 'Chiến binh Điện thoại', 'Thực hiện trên 500 cuộc gọi mỗi tháng', 'PhoneCall', 'calls', 500, 'text-blue-500'),
('revenue_champion', 'Vua Doanh số', 'Đạt doanh số trên 50,000,000 VND trong tháng', 'Award', 'revenue', 50000000, 'text-amber-500'),
('rising_star', 'Ngôi sao đang lên', 'Dành cho nhân sự tốt nhất trong tháng đầu tiên', 'Star', 'growth', 1, 'text-purple-500')
ON CONFLICT (id) DO NOTHING;

-- 3. User Achievements (Earned by users)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 4. Career Roadmap Levels
CREATE TABLE IF NOT EXISTS career_levels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    min_exp INTEGER NOT NULL, -- Experience points or total revenue scale
    icon_name TEXT
);

INSERT INTO career_levels (name, min_exp, icon_name) VALUES
('Tân binh', 0, 'User'),
('Chiến binh', 100, 'Shield'),
('Chuyên gia', 500, 'Zap'),
('Huyền thoại', 2000, 'Crown')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE bonding_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_levels ENABLE ROW LEVEL SECURITY;

-- Select policies (Mostly public for transparency as requested)
CREATE POLICY "Transparency: read bonding_fund" ON bonding_fund FOR SELECT USING (true);
CREATE POLICY "Transparency: read achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Transparency: read user_achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Transparency: read career_levels" ON career_levels FOR SELECT USING (true);

-- Management policies (Admin only)
CREATE POLICY "Admin manage bonding_fund" ON bonding_fund FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admin manage achievements" ON achievements FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admin manage user_achievements" ON user_achievements FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admin manage career_levels" ON career_levels FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
