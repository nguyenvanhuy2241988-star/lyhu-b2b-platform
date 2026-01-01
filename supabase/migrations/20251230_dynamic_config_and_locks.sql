-- Migration: 20251230_dynamic_config_and_locks.sql
-- Description: Add commission_rate to payroll_configs and create payroll_locks table.

-- 1. Add commission_rate to payroll_configs (Phase 3)
ALTER TABLE public.payroll_configs 
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.03;

-- Update existing records to have 0.03 default
UPDATE public.payroll_configs SET commission_rate = 0.03 WHERE commission_rate IS NULL;

-- 2. Create Payroll Locks table (Phase 3)
CREATE TABLE IF NOT EXISTS public.payroll_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT now(),
    locked_by UUID REFERENCES auth.users(id),
    UNIQUE(year, month)
);

-- 3. Enable RLS
ALTER TABLE public.payroll_locks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Admin full access to payroll_locks" ON public.payroll_locks
    FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "All can read payroll_locks" ON public.payroll_locks
    FOR SELECT TO authenticated USING (true);

-- 5. Update the RPC to use the dynamic commission rate
CREATE OR REPLACE FUNCTION get_telesales_metrics_v2(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
    v_total_calls BIGINT;
    v_total_orders BIGINT;
    v_total_revenue NUMERIC;
    v_commission_rate NUMERIC;
BEGIN
    -- Get commission rate from config (default to 0.03 if not found)
    SELECT COALESCE(commission_rate, 0.03) INTO v_commission_rate
    FROM public.payroll_configs
    WHERE role = 'telesales_parttime' -- Simplified for now, can be expanded
    LIMIT 1;

    -- 1. Count calls (tasks marked as done in the period)
    SELECT COUNT(*) INTO v_total_calls
    FROM public.telesales_tasks
    WHERE (user_id = p_user_id OR assigned_to = p_user_id)
      AND status = 'done'
      AND completed_at >= p_start_date
      AND completed_at <= p_end_date;

    -- 2. Aggregate orders
    SELECT 
        COUNT(*), 
        COALESCE(SUM(total_amount), 0)
    INTO v_total_orders, v_total_revenue
    FROM public.orders
    WHERE telesales_user_id = p_user_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date
      AND status != 'cancelled';

    -- 3. Return as JSON
    RETURN json_build_object(
        'totalCalls', v_total_calls,
        'totalOrders', v_total_orders,
        'totalRevenue', v_total_revenue,
        'totalCommission', v_total_revenue * v_commission_rate,
        'commissionRate', v_commission_rate,
        'conversionRate', CASE WHEN v_total_calls = 0 THEN 0 ELSE (v_total_orders::NUMERIC / v_total_calls) * 100 END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
