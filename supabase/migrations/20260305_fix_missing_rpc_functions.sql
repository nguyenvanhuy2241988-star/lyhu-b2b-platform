-- ============================================================
-- Fix: Tạo các RPC functions đang bị thiếu (gây lỗi 404 trên Console)
-- Date: 2026-03-05
-- NOTE: DROP trước CREATE để tránh lỗi "cannot change return type"
-- ============================================================

-- Drop tất cả functions cũ nếu tồn tại
DROP FUNCTION IF EXISTS public.count_new_outlets(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_user_kpi_settings(UUID);
DROP FUNCTION IF EXISTS public.update_user_kpi_settings(UUID, INT, INT, NUMERIC, NUMERIC, NUMERIC, JSONB, INT, INT);
DROP FUNCTION IF EXISTS public.create_financial_transaction_v2(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB);

-- ============================================================
-- 1. count_new_outlets(p_user_id, p_start, p_end)
--    Đếm số khách hàng mới mà đơn hàng ĐẦU TIÊN của họ
--    rơi vào khoảng thời gian [p_start, p_end]
-- ============================================================
CREATE OR REPLACE FUNCTION public.count_new_outlets(
    p_user_id UUID,
    p_start TIMESTAMPTZ,
    p_end TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(DISTINCT o.customer_id) INTO v_count
    FROM orders o
    WHERE o.telesales_user_id = p_user_id
      AND o.customer_id IS NOT NULL
      AND o.status NOT IN ('cancelled', 'draft')
      AND o.created_at >= p_start
      AND o.created_at <= p_end
      -- Chỉ đếm khách hàng mà đơn hàng đầu tiên nằm trong khoảng thời gian
      AND NOT EXISTS (
          SELECT 1 FROM orders o2
          WHERE o2.customer_id = o.customer_id
            AND o2.status NOT IN ('cancelled', 'draft')
            AND o2.created_at < p_start
      );

    RETURN json_build_object('count', v_count);
END;
$$;

-- ============================================================
-- 2. get_user_kpi_settings(p_user_id)
--    Lấy cài đặt KPI cho một user từ bảng user_kpi_settings
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_kpi_settings(
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT row_to_json(t) INTO v_result
    FROM (
        SELECT
            user_id,
            COALESCE(daily_calls_target, 50) AS daily_calls_target,
            COALESCE(daily_orders_target, 5) AS daily_orders_target,
            COALESCE(daily_revenue_target, 5000000) AS daily_revenue_target,
            COALESCE(commission_rate, 0.03) AS commission_rate,
            COALESCE(base_salary_monthly, 0) AS base_salary_monthly,
            COALESCE(kpi_targets, '{}'::jsonb) AS kpi_targets,
            COALESCE(working_days_standard, 26) AS working_days_standard,
            working_days_actual
        FROM user_kpi_settings
        WHERE user_id = p_user_id
        LIMIT 1
    ) t;

    -- Nếu chưa có settings, trả về defaults
    IF v_result IS NULL THEN
        v_result := json_build_object(
            'user_id', p_user_id,
            'daily_calls_target', 50,
            'daily_orders_target', 5,
            'daily_revenue_target', 5000000,
            'commission_rate', 0.03,
            'base_salary_monthly', 0,
            'kpi_targets', '{}'::json,
            'working_days_standard', 26,
            'working_days_actual', NULL
        );
    END IF;

    RETURN v_result;
END;
$$;

-- ============================================================
-- 3. update_user_kpi_settings(...)
--    Cập nhật (hoặc tạo mới) cài đặt KPI cho một user
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_user_kpi_settings(
    p_user_id UUID,
    p_daily_calls_target INT DEFAULT 50,
    p_daily_orders_target INT DEFAULT 5,
    p_daily_revenue_target NUMERIC DEFAULT 5000000,
    p_commission_rate NUMERIC DEFAULT 0.03,
    p_base_salary_monthly NUMERIC DEFAULT 0,
    p_kpi_targets JSONB DEFAULT '{}'::jsonb,
    p_working_days_standard INT DEFAULT 26,
    p_working_days_actual INT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_kpi_settings (
        user_id,
        daily_calls_target,
        daily_orders_target,
        daily_revenue_target,
        commission_rate,
        base_salary_monthly,
        kpi_targets,
        working_days_standard,
        working_days_actual,
        updated_at
    ) VALUES (
        p_user_id,
        p_daily_calls_target,
        p_daily_orders_target,
        p_daily_revenue_target,
        p_commission_rate,
        p_base_salary_monthly,
        p_kpi_targets,
        p_working_days_standard,
        p_working_days_actual,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        daily_calls_target = EXCLUDED.daily_calls_target,
        daily_orders_target = EXCLUDED.daily_orders_target,
        daily_revenue_target = EXCLUDED.daily_revenue_target,
        commission_rate = EXCLUDED.commission_rate,
        base_salary_monthly = EXCLUDED.base_salary_monthly,
        kpi_targets = EXCLUDED.kpi_targets,
        working_days_standard = EXCLUDED.working_days_standard,
        working_days_actual = EXCLUDED.working_days_actual,
        updated_at = NOW();
END;
$$;

-- ============================================================
-- 4. create_financial_transaction_v2(...)
--    Tạo giao dịch tài chính (thưởng/phạt/hoa hồng)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_financial_transaction_v2(
    p_user_id UUID,
    p_type TEXT,
    p_category TEXT,
    p_amount NUMERIC,
    p_status TEXT DEFAULT 'estimated',
    p_reference_id TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO financial_transactions (
        user_id, type, category, amount, status,
        reference_id, note, metadata, created_at
    ) VALUES (
        p_user_id, p_type, p_category, p_amount, p_status,
        p_reference_id, p_note, p_metadata, NOW()
    )
    RETURNING id INTO v_id;

    RETURN json_build_object('id', v_id, 'success', true);
END;
$$;

-- ============================================================
-- Đảm bảo bảng user_kpi_settings tồn tại
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_kpi_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_calls_target INT DEFAULT 50,
    daily_orders_target INT DEFAULT 5,
    daily_revenue_target NUMERIC DEFAULT 5000000,
    commission_rate NUMERIC DEFAULT 0.03,
    base_salary_monthly NUMERIC DEFAULT 0,
    kpi_targets JSONB DEFAULT '{}'::jsonb,
    working_days_standard INT DEFAULT 26,
    working_days_actual INT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Đảm bảo bảng financial_transactions tồn tại
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bonus', 'penalty', 'commission', 'base_salary')),
    category TEXT NOT NULL DEFAULT '',
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'estimated' CHECK (status IN ('estimated', 'finalized')),
    reference_id TEXT,
    note TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS cho user_kpi_settings
ALTER TABLE public.user_kpi_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_kpi_settings_select_all' AND tablename = 'user_kpi_settings') THEN
        CREATE POLICY user_kpi_settings_select_all ON public.user_kpi_settings FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_kpi_settings_all_auth' AND tablename = 'user_kpi_settings') THEN
        CREATE POLICY user_kpi_settings_all_auth ON public.user_kpi_settings FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- RLS cho financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'financial_transactions_select_all' AND tablename = 'financial_transactions') THEN
        CREATE POLICY financial_transactions_select_all ON public.financial_transactions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'financial_transactions_all_auth' AND tablename = 'financial_transactions') THEN
        CREATE POLICY financial_transactions_all_auth ON public.financial_transactions FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
END $$;
