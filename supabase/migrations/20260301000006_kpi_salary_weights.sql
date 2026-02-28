-- KPI Metric Definitions: Customizable KPI metrics with salary weights
-- Admin can add/remove/edit KPI metrics and their salary percentages

CREATE TABLE IF NOT EXISTS public.kpi_metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT DEFAULT '',
    data_source TEXT NOT NULL DEFAULT 'manual',  -- 'auto' or 'manual'
    icon TEXT DEFAULT 'Target',                  -- Lucide icon name
    field_type TEXT DEFAULT 'number',            -- 'number', 'currency', 'percentage'
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    salary_percent NUMERIC DEFAULT 0,            -- % of base salary
    monthly_target NUMERIC DEFAULT 0,            -- Default monthly target
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.kpi_metric_definitions ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed for KPI dashboard)
CREATE POLICY "Anyone can read kpi_metric_definitions" ON public.kpi_metric_definitions
    FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert kpi_metric_definitions" ON public.kpi_metric_definitions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
    );

CREATE POLICY "Admins can update kpi_metric_definitions" ON public.kpi_metric_definitions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
    );

CREATE POLICY "Admins can delete kpi_metric_definitions" ON public.kpi_metric_definitions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
    );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE kpi_metric_definitions;

-- Seed default KPI metrics matching existing dashboard
INSERT INTO public.kpi_metric_definitions (key, label, description, data_source, icon, field_type, is_active, sort_order, salary_percent, monthly_target) VALUES
    ('calls', 'Cuộc gọi', 'Cuộc gọi nghe máy (answered)', 'auto', 'Phone', 'number', true, 1, 15, 1000),
    ('self_sourced', 'Data tự tìm', 'Khách hàng mới tự tìm kiếm', 'auto', 'ShoppingBag', 'number', true, 2, 10, 30),
    ('fb_group_posts', 'FB Groups/Page', 'Bài đăng trên nhóm/page FB', 'manual', 'Share2', 'number', true, 3, 5, 500),
    ('fb_comments', 'FB Comment (Seed)', 'Bình luận seeding trên FB', 'manual', 'MessageSquare', 'number', true, 4, 5, 250),
    ('fb_friends', 'Kết bạn FB', 'Kết bạn mới trên Facebook', 'manual', 'Users', 'number', true, 5, 5, 200),
    ('fb_personal_posts', 'FB Cá Nhân', 'Bài đăng FB cá nhân', 'manual', 'Share2', 'number', true, 6, 5, 150),
    ('zalo_posts', 'Zalo Bài', 'Bài đăng trên Zalo', 'manual', 'Share2', 'number', true, 7, 5, 100),
    ('revenue', 'Doanh số', 'Doanh số thực thu tháng (đơn giao thành công)', 'auto', 'DollarSign', 'currency', true, 8, 35, 50000000),
    ('new_outlets', 'Mở mới Đại lý', 'Khách hàng mới phát sinh đơn đầu tiên', 'auto', 'TrendingUp', 'number', true, 9, 15, 5)
ON CONFLICT (key) DO NOTHING;

-- Per-user KPI overrides: allows admin to set different targets per user
CREATE TABLE IF NOT EXISTS public.kpi_user_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_key TEXT NOT NULL REFERENCES public.kpi_metric_definitions(key) ON DELETE CASCADE,
    monthly_target NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, metric_key)
);

ALTER TABLE public.kpi_user_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own kpi targets" ON public.kpi_user_targets
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin')));

CREATE POLICY "Admins can manage kpi targets" ON public.kpi_user_targets
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin')));

ALTER PUBLICATION supabase_realtime ADD TABLE kpi_user_targets;
