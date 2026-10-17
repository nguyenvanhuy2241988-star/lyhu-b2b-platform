-- ====================================================================
-- MIGRATION: 20261017000001_security_hardening_and_fixes.sql
-- PROJECT: wepxcpifgxghfvdgnkeh (LYHU Platform)
--
-- INCLUDES:
-- 1. A2: Create app_secrets table with strict RLS, migrate misa_config & facebook_ads_config, clean app_settings
-- 2. A3: SECURITY DEFINER RPCs for financial_transactions updates/deletions & RLS policies
-- 3. A6: company_social_accounts RLS tightening (Admin only)
-- 4. B1: Fix get_admin_dashboard_stats revenue and profit calculation (strictly avoid order_items Cartesian product)
-- 5. B2: Normalize telesales_tasks status values and add status constraint
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. A2: CREATE app_secrets TABLE & MIGRATE CONFIGURATIONS
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "app_secrets_admin_all" ON public.app_secrets;
DROP POLICY IF EXISTS "app_secrets_accountant_misa" ON public.app_secrets;
DROP POLICY IF EXISTS "app_secrets_marketing_facebook" ON public.app_secrets;

-- Admin has full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "app_secrets_admin_all" ON public.app_secrets
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Accountant can read misa_config
CREATE POLICY "app_secrets_accountant_misa" ON public.app_secrets
FOR SELECT
TO authenticated
USING (
    key = 'misa_config' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
);

-- Marketing can read facebook_ads_config
CREATE POLICY "app_secrets_marketing_facebook" ON public.app_secrets
FOR SELECT
TO authenticated
USING (
    key = 'facebook_ads_config' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'marketing')
    )
);

-- Migrate current misa_config from app_settings
INSERT INTO public.app_secrets (key, value, description)
SELECT 
    'misa_config', 
    misa_config::jsonb, 
    'MISA AMIS ACT Integration Configuration'
FROM public.app_settings
WHERE misa_config IS NOT NULL 
  AND misa_config::text != 'null' 
  AND misa_config::text != '{}'
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- Migrate current facebook_ads_config from app_settings
INSERT INTO public.app_secrets (key, value, description)
SELECT 
    'facebook_ads_config', 
    facebook_ads_config::jsonb, 
    'Facebook Marketing & Ads API Tokens'
FROM public.app_settings
WHERE facebook_ads_config IS NOT NULL 
  AND facebook_ads_config::text != 'null' 
  AND facebook_ads_config::text != '{}'
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- Clean up app_settings policies
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_update_authenticated" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_update_authorized_staff" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_insert_admin" ON public.app_settings;

-- Only admin, marketing, sale_admin can update app_settings
CREATE POLICY "app_settings_update_authorized_staff" ON public.app_settings
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'marketing', 'sale_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'marketing', 'sale_admin')
    )
);

-- Only admin can insert into app_settings
CREATE POLICY "app_settings_insert_admin" ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Clear sensitive secrets from app_settings
UPDATE public.app_settings
SET misa_config = NULL, facebook_ads_config = NULL
WHERE misa_config IS NOT NULL OR facebook_ads_config IS NOT NULL;


-- --------------------------------------------------------------------
-- 2. A3: FINANCIAL TRANSACTIONS WRITE PATHS & SECURITY DEFINER RPCs
-- --------------------------------------------------------------------

-- RPC to update transaction status by reference_id (e.g. order commission finalized/cancelled)
CREATE OR REPLACE FUNCTION public.update_financial_transaction_status(
    p_reference_id TEXT,
    p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.financial_transactions
    SET 
        status = p_status,
        updated_at = now()
    WHERE reference_id = p_reference_id;

    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_financial_transaction_status(TEXT, TEXT) TO authenticated, service_role;

-- RPC to delete financial transactions by reference_id or id
CREATE OR REPLACE FUNCTION public.delete_financial_transactions(
    p_reference_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.financial_transactions
    WHERE reference_id = p_reference_id OR id::text = p_reference_id;

    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_financial_transactions(TEXT) TO authenticated, service_role;

-- Ensure financial_transactions RLS policies for accountant write access
DROP POLICY IF EXISTS "financial_transactions_insert_staff" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_staff" ON public.financial_transactions;

CREATE POLICY "financial_transactions_insert_staff" ON public.financial_transactions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager')
    )
);

CREATE POLICY "financial_transactions_update_staff" ON public.financial_transactions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
);


-- --------------------------------------------------------------------
-- 3. A6: COMPANY SOCIAL ACCOUNTS RLS (Admin Only)
-- --------------------------------------------------------------------

ALTER TABLE IF EXISTS public.company_social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_social_accounts_all_auth" ON public.company_social_accounts;
DROP POLICY IF EXISTS "company_social_accounts_admin_full" ON public.company_social_accounts;

CREATE POLICY "company_social_accounts_admin_full" ON public.company_social_accounts
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);


-- --------------------------------------------------------------------
-- 4. B1: REWRITE get_admin_dashboard_stats (Fix Revenue & Profit Calculation)
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_leads INT := 0;
    v_total_ctv_leads INT := 0;
    v_total_sales_leads INT := 0;
    v_total_telesales_leads INT := 0;
    v_converted_leads INT := 0;
    
    v_total_orders INT := 0;
    v_total_revenue NUMERIC := 0;
    v_total_profit NUMERIC := 0;
    
    v_result JSON;
BEGIN
    -- 1. Leads Stats
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE source = 'CTV'),
        COUNT(*) FILTER (WHERE source = 'Sales'),
        COUNT(*) FILTER (WHERE source = 'Telesales'),
        COUNT(*) FILTER (WHERE stage = 'won')
    INTO 
        v_total_leads,
        v_total_ctv_leads,
        v_total_sales_leads,
        v_total_telesales_leads,
        v_converted_leads
    FROM public.crm_leads
    WHERE created_at >= p_start_date AND created_at <= p_end_date;

    -- 2. Orders & Revenue: Computed STRICTLY from orders table without JOINing order_items
    -- This prevents multiplying total_amount by the number of item rows per order.
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0)
    INTO 
        v_total_orders,
        v_total_revenue
    FROM public.orders
    WHERE 
        created_at >= p_start_date 
        AND created_at <= p_end_date
        AND status NOT IN ('cancelled', 'draft');

    -- 3. Profit: Calculated from order_items with proper cost deduction
    SELECT 
        COALESCE(
            SUM(
                oi.quantity * (
                    oi.price - COALESCE(
                        NULLIF(oi.cost_at_purchase, 0),
                        p.cost_price,
                        0
                    )
                )
            ),
            0
        )
    INTO 
        v_total_profit
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    LEFT JOIN public.products p ON oi.product_id = p.id
    WHERE 
        o.created_at >= p_start_date 
        AND o.created_at <= p_end_date
        AND o.status NOT IN ('cancelled', 'draft');

    v_result := json_build_object(
        'totalLeads', COALESCE(v_total_leads, 0),
        'totalCTVLeads', COALESCE(v_total_ctv_leads, 0),
        'totalSalesLeads', COALESCE(v_total_sales_leads, 0),
        'totalTelesalesLeads', COALESCE(v_total_telesales_leads, 0),
        'convertedLeads', COALESCE(v_converted_leads, 0),
        'totalOrders', COALESCE(v_total_orders, 0),
        'totalOrderRevenue', COALESCE(v_total_revenue, 0),
        'totalProfit', COALESCE(v_total_profit, 0),
        'totalEstimatedRevenue', 0 
    );

    RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats(TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;


-- --------------------------------------------------------------------
-- 5. B2: NORMALIZE telesales_tasks STATUS VALUES & ADD CONSTRAINT
-- --------------------------------------------------------------------

-- Step 1: Map completed tasks with completed_at or 'done' to 'done'
UPDATE public.telesales_tasks
SET status = 'done'
WHERE completed_at IS NOT NULL OR status = 'done';

-- Step 2: Map UUID column placements in status to column_type if matched in task_user_columns
UPDATE public.telesales_tasks t
SET status = CASE 
    WHEN c.column_type = 'system_done' THEN 'done'
    WHEN c.column_type = 'date_today' THEN 'today'
    WHEN c.column_type = 'date_tomorrow' THEN 'tomorrow'
    WHEN c.column_type = 'date_this_week' THEN 'this_week'
    WHEN c.column_type = 'date_this_month' THEN 'this_month'
    ELSE 'inbox'
END
FROM public.task_user_columns c
WHERE t.status = c.id::text;

-- Step 3: Map any status strings containing keywords
UPDATE public.telesales_tasks
SET status = 'this_month'
WHERE status LIKE '%this_month%';

UPDATE public.telesales_tasks
SET status = 'this_week'
WHERE status LIKE '%this_week%';

UPDATE public.telesales_tasks
SET status = 'today'
WHERE status LIKE '%today%';

UPDATE public.telesales_tasks
SET status = 'tomorrow'
WHERE status LIKE '%tomorrow%';

-- Step 4: Map legacy 'active' or remaining non-standard status values to 'today' or 'inbox'
UPDATE public.telesales_tasks
SET status = CASE 
    WHEN due_date::date = CURRENT_DATE THEN 'today'
    WHEN due_date::date > CURRENT_DATE AND due_date::date <= (CURRENT_DATE + INTERVAL '7 days') THEN 'this_week'
    ELSE 'inbox'
END
WHERE status NOT IN ('inbox', 'today', 'tomorrow', 'this_week', 'this_month', 'done')
   OR status IS NULL;

-- Step 5: Enforce CHECK constraint on status
ALTER TABLE public.telesales_tasks
DROP CONSTRAINT IF EXISTS chk_telesales_tasks_status;

ALTER TABLE public.telesales_tasks
ADD CONSTRAINT chk_telesales_tasks_status
CHECK (status IN ('inbox', 'today', 'tomorrow', 'this_week', 'this_month', 'done'));
