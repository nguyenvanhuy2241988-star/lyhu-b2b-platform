-- Migration: 20251230_payroll_system.sql
-- Description: Create tables for Payroll, Bonuses and Penalties

-- 1. Create Payroll Configs table
CREATE TABLE IF NOT EXISTS public.payroll_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL UNIQUE, -- 'telesales_parttime', 'telesales_fulltime', 'admin', etc.
    label TEXT NOT NULL,
    base_salary_monthly NUMERIC DEFAULT 0,
    bonus_new_supermarket NUMERIC DEFAULT 100000,
    bonus_new_agency NUMERIC DEFAULT 300000,
    bonus_new_distributor NUMERIC DEFAULT 500000,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Financial Transactions table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bonus', 'penalty', 'commission', 'base_salary')),
    category TEXT NOT NULL, -- 'new_customer', 'innovation', 'holiday', 'late', 'uniform', 'absence', 'kpi', 'monthly_base'
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'estimated' CHECK (status IN ('estimated', 'finalized')),
    reference_id TEXT, -- Order ID, Lead ID, etc.
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Enable RLS
ALTER TABLE public.payroll_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Payroll Configs: Admin can do everything, others can read
CREATE POLICY "Admin full access to payroll_configs" ON public.payroll_configs
    FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "All authenticated can read payroll_configs" ON public.payroll_configs
    FOR SELECT TO authenticated USING (true);

-- Financial Transactions: Admin full access, users can see their own
CREATE POLICY "Admin full access to financial_transactions" ON public.financial_transactions
    FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can see their own transactions" ON public.financial_transactions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. Seed Data for Telesales
INSERT INTO public.payroll_configs (role, label, base_salary_monthly, bonus_new_supermarket, bonus_new_agency, bonus_new_distributor)
VALUES 
('telesales_parttime', 'Telesales Part-time', 2500000, 100000, 300000, 500000)
ON CONFLICT (role) DO UPDATE SET 
    base_salary_monthly = EXCLUDED.base_salary_monthly,
    bonus_new_supermarket = EXCLUDED.bonus_new_supermarket,
    bonus_new_agency = EXCLUDED.bonus_new_agency,
    bonus_new_distributor = EXCLUDED.bonus_new_distributor;

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payroll_configs_updated_at BEFORE UPDATE ON public.payroll_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
