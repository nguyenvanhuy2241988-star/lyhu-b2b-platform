-- 1. Drop previous buggy versions
DROP FUNCTION IF EXISTS get_telesales_kpi_v4(text);

-- 2. Create DEFINITIVE V4 Tracking RPC
CREATE OR REPLACE FUNCTION get_telesales_kpi_v4(data TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payload JSONB;
    p_user_id UUID;
    p_month INT;
    p_year INT;
    v_start_date DATE;
    v_end_date DATE;
    v_new_outlets INT;
    v_revenue NUMERIC;
    v_logged_activities INT;
    v_self_sourced_leads INT;
    v_retention_rate NUMERIC;
    v_debt_collection NUMERIC;
    v_active_customers_prev_period INT;
    v_retained_customers_current_period INT;
    v_targets JSONB;
    v_base_salary NUMERIC;
    v_prev_start_date DATE;
    v_prev_end_date DATE;
BEGIN
    -- Parse text to json
    payload := data::JSONB;
    p_user_id := (payload->>'user_id')::UUID;
    p_month := (payload->>'month')::INT;
    p_year := (payload->>'year')::INT;

    v_start_date := make_date(p_year, p_month, 1);
    v_end_date := (v_start_date + interval '1 month' - interval '1 day')::DATE;
    v_prev_end_date := (v_start_date - interval '1 day')::DATE;
    v_prev_start_date := (v_prev_end_date - interval '3 months' + interval '1 day')::DATE;

    -- 1. Leads
    -- FIX: Removed 'source' column check as it does not exist in schema.
    -- Assuming all leads assigned to the user are relevant for now.
    SELECT COUNT(*) INTO v_self_sourced_leads
    FROM public.leads
    WHERE assigned_to = p_user_id 
      AND created_at >= v_start_date 
      AND created_at <= v_end_date;

    -- 2. Logged Activities
    -- FIX: Used 'owner_id' instead of 'user_id'
    SELECT COUNT(*) INTO v_logged_activities
    FROM public.telesales_tasks
    WHERE (owner_id = p_user_id OR assigned_to = p_user_id)
      AND status = 'done'
      AND completed_at >= v_start_date::timestamptz
      AND completed_at < (v_end_date + interval '1 day')::timestamptz;

    -- 3. Revenue
    -- FIX: Used 'telesales_user_id' instead of 'user_id'
    SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue
    FROM public.orders
    WHERE telesales_user_id = p_user_id
      AND status = 'delivered'
      AND created_at >= v_start_date::timestamptz
      AND created_at < (v_end_date + interval '1 day')::timestamptz;
    
    -- 4. New Outlets
    -- FIX: Used 'telesales_user_id' instead of 'user_id'
    WITH month_orders AS (
        SELECT DISTINCT customer_id
        FROM public.orders
        WHERE telesales_user_id = p_user_id
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

    -- 5. Retention
    -- FIX: Used 'telesales_user_id' instead of 'user_id'
    WITH prev_active_customers AS (
        SELECT DISTINCT customer_id
        FROM public.orders
        WHERE telesales_user_id = p_user_id
          AND status = 'delivered'
          AND created_at >= v_prev_start_date::timestamptz
          AND created_at <= v_prev_end_date::timestamptz
    )
    SELECT COUNT(*) INTO v_active_customers_prev_period FROM prev_active_customers;
    
    IF v_active_customers_prev_period > 0 THEN
        SELECT COUNT(DISTINCT o.customer_id) INTO v_retained_customers_current_period
        FROM public.orders o
        JOIN prev_active_customers pac ON o.customer_id = pac.customer_id
        WHERE o.telesales_user_id = p_user_id
          AND o.status = 'delivered'
          AND o.created_at >= v_start_date::timestamptz
          AND o.created_at < (v_end_date + interval '1 day')::timestamptz;
        v_retention_rate := ROUND((v_retained_customers_current_period::NUMERIC / v_active_customers_prev_period::NUMERIC) * 100, 2);
    ELSE 
        v_retention_rate := 0; 
    END IF;

    v_debt_collection := 0; 

    -- Get Settings
    SELECT kpi_targets, base_salary_monthly INTO v_targets, v_base_salary
    FROM public.user_kpi_settings
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'metrics', jsonb_build_object(
            'revenue', v_revenue,
            'new_outlets', v_new_outlets,
            'logged_activities', v_logged_activities,
            'self_sourced_leads', v_self_sourced_leads,
            'retention_rate', v_retention_rate,
            'debt_collection', v_debt_collection
        ),
        'targets', COALESCE(v_targets, '{}'::jsonb),
        'base_salary', COALESCE(v_base_salary, 0),
        'month', p_month,
        'year', p_year
    );
END;
$$;

NOTIFY pgrst, 'reload schema';
