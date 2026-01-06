-- 1. Upgrade user_kpi_settings table
ALTER TABLE public.user_kpi_settings 
ADD COLUMN IF NOT EXISTS kpi_targets JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS base_salary_monthly NUMERIC DEFAULT 0;

-- 2. Update Getter RPC
DROP FUNCTION IF EXISTS get_user_kpi_settings(uuid);

CREATE OR REPLACE FUNCTION get_user_kpi_settings(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(t) INTO v_result
    FROM public.user_kpi_settings t
    WHERE user_id = p_user_id;
    
    IF v_result IS NULL THEN
        -- Return defaults if not found
        v_result := jsonb_build_object(
            'user_id', p_user_id,
            'daily_calls_target', 50,
            'daily_orders_target', 5,
            'daily_revenue_target', 5000000,
            'commission_rate', 0.03,
            'base_salary_monthly', 0,
            'kpi_targets', '{}'::jsonb
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- 3. Update Setter RPC (Upsert)
DROP FUNCTION IF EXISTS update_user_kpi_settings(uuid, int, int, numeric, numeric, numeric, jsonb);
-- Also drop old signature if it existed without new params to be clean (optional but good practice if params changed count)
DROP FUNCTION IF EXISTS update_user_kpi_settings(uuid, int, int, numeric, numeric); 

CREATE OR REPLACE FUNCTION update_user_kpi_settings(
    p_user_id UUID,
    p_daily_calls_target INT,
    p_daily_orders_target INT,
    p_daily_revenue_target NUMERIC,
    p_commission_rate NUMERIC,
    p_base_salary_monthly NUMERIC,
    p_kpi_targets JSONB
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
        updated_at
    ) VALUES (
        p_user_id, 
        p_daily_calls_target, 
        p_daily_orders_target, 
        p_daily_revenue_target, 
        p_commission_rate,
        p_base_salary_monthly,
        p_kpi_targets,
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET 
        daily_calls_target = EXCLUDED.daily_calls_target,
        daily_orders_target = EXCLUDED.daily_orders_target,
        daily_revenue_target = EXCLUDED.daily_revenue_target,
        commission_rate = EXCLUDED.commission_rate,
        base_salary_monthly = EXCLUDED.base_salary_monthly,
        kpi_targets = EXCLUDED.kpi_targets,
        updated_at = now();
END;
$$;

-- 4. Create Tracking RPC (The Calculator)
CREATE OR REPLACE FUNCTION get_telesales_kpi_tracking(
    p_user_id UUID, 
    p_month INT, 
    p_year INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_prev_start_date DATE;
    v_prev_end_date DATE;
    
    -- Metrics
    v_self_sourced_leads INT;
    v_logged_activities INT;
    v_new_outlets INT;
    v_revenue NUMERIC;
    v_debt_collection NUMERIC;
    
    -- Retention Calculation
    v_active_customers_prev_period INT;
    v_retained_customers_current_period INT;
    v_retention_rate NUMERIC;
    
    -- Targets (from Settings)
    v_targets JSONB;
    v_base_salary NUMERIC;
    v_kpi_result JSONB;
BEGIN
    -- Time Frames
    v_start_date := make_date(p_year, p_month, 1);
    v_end_date := (v_start_date + interval '1 month' - interval '1 day')::DATE;
    
    -- Previous Period (Last 3 months to define "Active Customer")
    v_prev_end_date := (v_start_date - interval '1 day')::DATE;
    v_prev_start_date := (v_prev_end_date - interval '3 months' + interval '1 day')::DATE;

    -- 1. Self Sourced Leads
    -- Counting leads created by user (assigned_to) with source indicating self-source
    -- Adjust 'source' logic as strictly needed.
    SELECT COUNT(*) INTO v_self_sourced_leads
    FROM public.leads
    WHERE assigned_to = p_user_id 
      AND created_at >= v_start_date 
      AND created_at <= v_end_date
      AND (source = 'self_sourced' OR source = 'tu_tim_kiem');

    -- 2. Logged Activities (Tasks marked as 'done')
    SELECT COUNT(*) INTO v_logged_activities
    FROM public.telesales_tasks
    WHERE (user_id = p_user_id OR assigned_to = p_user_id)
      AND status = 'done'
      AND completed_at >= v_start_date::timestamptz
      AND completed_at < (v_end_date + interval '1 day')::timestamptz;

    -- 3. Revenue (Delivered Orders)
    SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue
    FROM public.orders
    WHERE user_id = p_user_id
      AND status = 'delivered'
      AND created_at >= v_start_date::timestamptz
      AND created_at < (v_end_date + interval '1 day')::timestamptz;

    -- 4. New Outlets
    WITH month_orders AS (
        SELECT DISTINCT customer_id
        FROM public.orders
        WHERE user_id = p_user_id
          AND status = 'delivered'
          AND created_at >= v_start_date::timestamptz
          AND created_at < (v_end_date + interval '1 day')::timestamptz
    )
    SELECT COUNT(*) INTO v_new_outlets
    FROM month_orders mo
    WHERE NOT EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.customer_id = mo.customer_id
          AND o.status = 'delivered'
          AND o.created_at < v_start_date::timestamptz
    );

    -- 5. Retention Rate
    WITH prev_active_customers AS (
        SELECT DISTINCT customer_id
        FROM public.orders
        WHERE user_id = p_user_id
          AND status = 'delivered'
          AND created_at >= v_prev_start_date::timestamptz
          AND created_at <= v_prev_end_date::timestamptz
    )
    SELECT COUNT(*) INTO v_active_customers_prev_period FROM prev_active_customers;
    
    IF v_active_customers_prev_period > 0 THEN
        SELECT COUNT(DISTINCT o.customer_id) INTO v_retained_customers_current_period
        FROM public.orders o
        JOIN prev_active_customers pac ON o.customer_id = pac.customer_id
        WHERE o.user_id = p_user_id
          AND o.status = 'delivered'
          AND o.created_at >= v_start_date::timestamptz
          AND o.created_at < (v_end_date + interval '1 day')::timestamptz;
          
        v_retention_rate := ROUND((v_retained_customers_current_period::NUMERIC / v_active_customers_prev_period::NUMERIC) * 100, 2);
    ELSE
        v_retention_rate := 0;
    END IF;

    -- 6. Debt Collection
    v_debt_collection := 0; 

    -- Get Targets
    SELECT kpi_targets, base_salary_monthly INTO v_targets, v_base_salary
    FROM public.user_kpi_settings
    WHERE user_id = p_user_id;

    -- Construct Result
    v_kpi_result := jsonb_build_object(
        'metrics', jsonb_build_object(
            'self_sourced_leads', v_self_sourced_leads,
            'logged_activities', v_logged_activities,
            'new_outlets', v_new_outlets,
            'revenue', v_revenue,
            'retention_rate', v_retention_rate,
            'debt_collection', v_debt_collection
        ),
        'targets', COALESCE(v_targets, '{}'::jsonb),
        'base_salary', COALESCE(v_base_salary, 0),
        'month', p_month,
        'year', p_year
    );

    RETURN v_kpi_result;
END;
$$;
