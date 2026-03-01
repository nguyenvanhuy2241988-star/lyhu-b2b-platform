-- Add working days columns to user_kpi_settings
ALTER TABLE public.user_kpi_settings 
    ADD COLUMN IF NOT EXISTS working_days_standard INTEGER DEFAULT 26,
    ADD COLUMN IF NOT EXISTS working_days_actual INTEGER DEFAULT NULL;

-- Update getter RPC to include working_days
DROP FUNCTION IF EXISTS get_user_kpi_settings(uuid);

CREATE OR REPLACE FUNCTION get_user_kpi_settings(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_auto_days INTEGER;
BEGIN
    -- Auto-count working days from approved shift_registrations in current month
    SELECT COUNT(DISTINCT sr.date) INTO v_auto_days
    FROM public.shift_registrations sr
    WHERE sr.user_id = p_user_id
      AND sr.status = 'approved'
      AND sr.date >= date_trunc('month', CURRENT_DATE)::date
      AND sr.date <= (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;

    SELECT to_jsonb(t) INTO v_result
    FROM public.user_kpi_settings t
    WHERE user_id = p_user_id;
    
    IF v_result IS NULL THEN
        v_result := jsonb_build_object(
            'user_id', p_user_id,
            'daily_calls_target', 50,
            'daily_orders_target', 5,
            'daily_revenue_target', 5000000,
            'commission_rate', 0.03,
            'base_salary_monthly', 0,
            'kpi_targets', '{}'::jsonb,
            'working_days_standard', 26,
            'working_days_actual', NULL,
            'auto_working_days', v_auto_days
        );
    ELSE
        -- Inject auto_working_days into result
        v_result := v_result || jsonb_build_object('auto_working_days', v_auto_days);
    END IF;
    
    RETURN v_result;
END;
$$;

-- Update setter RPC to include working_days
DROP FUNCTION IF EXISTS update_user_kpi_settings(uuid, int, int, numeric, numeric, numeric, jsonb);

CREATE OR REPLACE FUNCTION update_user_kpi_settings(
    p_user_id UUID,
    p_daily_calls_target INT,
    p_daily_orders_target INT,
    p_daily_revenue_target NUMERIC,
    p_commission_rate NUMERIC,
    p_base_salary_monthly NUMERIC,
    p_kpi_targets JSONB,
    p_working_days_standard INT DEFAULT 26,
    p_working_days_actual INT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_kpi_settings (
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
        now()
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
        updated_at = now();
END;
$$;
