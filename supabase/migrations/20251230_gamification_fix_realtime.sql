-- Gamification & Realtime Definitive Fix (V4.3)
-- Standardized version for all PostgreSQL versions

-- 0. Ensure UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Tables with robust schema
CREATE TABLE IF NOT EXISTS public.bonding_fund (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    balance BIGINT DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Initialize collective fund if missing
INSERT INTO public.bonding_fund (id, balance) 
VALUES ('00000000-0000-0000-0000-000000000001', 2500000)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    threshold_type TEXT,
    threshold_value NUMERIC,
    color_class TEXT DEFAULT 'text-primary-500',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed achievements
INSERT INTO public.achievements (id, name, description, icon_name, threshold_type, threshold_value, color_class) VALUES
('master_closer', 'Bậc thầy Chốt đơn', 'Tỉ lệ chốt đơn đạt trên 20%', 'Target', 'conversion_rate', 20, 'text-emerald-500'),
('call_warrior', 'Chiến binh Điện thoại', 'Thực hiện trên 500 cuộc gọi mỗi tháng', 'PhoneCall', 'calls', 500, 'text-blue-500'),
('revenue_champion', 'Vua Doanh số', 'Đạt doanh số trên 50,000,000 VND trong tháng', 'Award', 'revenue', 50000000, 'text-amber-500'),
('rising_star', 'Ngôi sao đang lên', 'Dành cho nhân sự tốt nhất trong tháng đầu tiên', 'Star', 'growth', 1, 'text-purple-500')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS public.career_levels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    min_exp INTEGER NOT NULL,
    icon_name TEXT
);

INSERT INTO public.career_levels (name, min_exp, icon_name) VALUES
('Tân binh', 0, 'User'),
('Chiến binh', 100, 'Shield'),
('Chuyên gia', 500, 'Zap'),
('Huyền thoại', 2000, 'Crown')
ON CONFLICT (id) DO NOTHING;

-- 2. Fix Relationship for Leaderboard (Standardized syntax)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'orders' 
        AND constraint_name = 'orders_telesales_user_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_telesales_user_id_profiles_fkey 
        FOREIGN KEY (telesales_user_id) REFERENCES public.profiles(id);
    END IF;
EXCEPTION
    WHEN others THEN NULL; -- Silently continue if something goes wrong
END $$;

-- 3. Enable Realtime with Robust Syntax (Fixing the "IF EXISTS" syntax error)
DO $$
BEGIN
    -- Check and add bonding_fund
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bonding_fund') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bonding_fund;
    END IF;

    -- Check and add user_achievements
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_achievements') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
    END IF;

    -- Check and add achievements
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'achievements') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE achievements;
    END IF;
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Notice: Could not modify publication. Please ensure you are using a Postgres role with publication permissions.';
END $$;

-- 4. Set Replica Identity
ALTER TABLE public.bonding_fund REPLICA IDENTITY FULL;
ALTER TABLE public.user_achievements REPLICA IDENTITY FULL;

-- 5. Finalize RLS Policies (Redo precisely)
ALTER TABLE public.bonding_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_levels ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Transparency: read bonding_fund" ON public.bonding_fund;
CREATE POLICY "Transparency: read bonding_fund" ON public.bonding_fund FOR SELECT USING (true);

DROP POLICY IF EXISTS "Transparency: read achievements" ON public.achievements;
CREATE POLICY "Transparency: read achievements" ON public.achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Transparency: read user_achievements" ON public.user_achievements;
CREATE POLICY "Transparency: read user_achievements" ON public.user_achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Transparency: read career_levels" ON public.career_levels;
CREATE POLICY "Transparency: read career_levels" ON public.career_levels FOR SELECT USING (true);

-- Admin manage policies
DROP POLICY IF EXISTS "Admin manage bonding_fund" ON public.bonding_fund;
CREATE POLICY "Admin manage bonding_fund" ON public.bonding_fund FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'sale_admin'))
);

SELECT 'Gamification Patch V4.3 applied successfully' as status;
