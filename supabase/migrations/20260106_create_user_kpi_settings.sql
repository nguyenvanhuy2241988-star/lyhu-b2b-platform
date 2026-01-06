-- PHASE 3: KPI MANAGEMENT
-- Run this in Supabase SQL Editor

-- 1. Create table for storing KPI settings per user
CREATE TABLE IF NOT EXISTS public.user_kpi_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_calls_target INT DEFAULT 50,
    daily_orders_target INT DEFAULT 5,
    daily_revenue_target NUMERIC DEFAULT 5000000,
    commission_rate NUMERIC DEFAULT 0.03, -- 3%
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.user_kpi_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Admin can do everything
CREATE POLICY "Admins can manage all kpi settings" 
ON public.user_kpi_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Users can read their own settings
CREATE POLICY "Users can view their own kpi settings" 
ON public.user_kpi_settings
FOR SELECT
USING (auth.uid() = user_id);

-- 4. RPC to Get Settings (with default fallback)
CREATE OR REPLACE FUNCTION get_user_kpi_settings(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'user_id', user_id,
        'daily_calls_target', daily_calls_target,
        'daily_orders_target', daily_orders_target,
        'daily_revenue_target', daily_revenue_target,
        'commission_rate', commission_rate
    ) INTO v_result
    FROM public.user_kpi_settings
    WHERE user_id = p_user_id;

    -- Return defaults if no settings found
    IF v_result IS NULL THEN
        RETURN json_build_object(
            'user_id', p_user_id,
            'daily_calls_target', 50,
            'daily_orders_target', 5,
            'daily_revenue_target', 5000000,
            'commission_rate', 0.03
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC to Update Settings (Upsert)
CREATE OR REPLACE FUNCTION update_user_kpi_settings(
    p_user_id UUID,
    p_daily_calls INT,
    p_daily_orders INT,
    p_daily_revenue NUMERIC,
    p_commission_rate NUMERIC
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_kpi_settings (user_id, daily_calls_target, daily_orders_target, daily_revenue_target, commission_rate, updated_at)
    VALUES (p_user_id, p_daily_calls, p_daily_orders, p_daily_revenue, p_commission_rate, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        daily_calls_target = EXCLUDED.daily_calls_target,
        daily_orders_target = EXCLUDED.daily_orders_target,
        daily_revenue_target = EXCLUDED.daily_revenue_target,
        commission_rate = EXCLUDED.commission_rate,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
