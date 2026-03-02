-- Add 'zalo_outreach' KPI metric definition for tracking Zalo messages
-- This metric has 0% salary weight - purely for tracking purposes
-- Admin can adjust target and salary_percent later if needed

INSERT INTO public.kpi_metric_definitions (key, label, description, data_source, icon, field_type, is_active, sort_order, salary_percent, monthly_target)
VALUES (
    'zalo_outreach',
    'Nhắn Zalo',
    'Số KH đã nhắn tin Zalo (không tính KPI lương, chỉ theo dõi)',
    'auto',
    'MessageCircle',
    'number',
    true,
    8,  -- After zalo_posts (sort_order=7), before revenue (sort_order=8 -> now 9)
    0,  -- 0% salary - tracking only
    0   -- No target by default
)
ON CONFLICT (key) DO NOTHING;

-- Bump sort_order for revenue and new_outlets to make room
UPDATE public.kpi_metric_definitions SET sort_order = 9 WHERE key = 'revenue' AND sort_order = 8;
UPDATE public.kpi_metric_definitions SET sort_order = 10 WHERE key = 'new_outlets' AND sort_order = 9;
