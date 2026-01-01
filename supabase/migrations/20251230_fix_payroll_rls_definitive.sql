-- Migration: 20251230_fix_payroll_rls_definitive.sql
-- Description: STANDALONE CONSOLIDATED FIX for Payroll System Phase 3 & 4.
-- Ensures all tables exist, columns are added, and RLS policies are robust (profile-based).

BEGIN;

-- ==========================================
-- 1. SCHEMA ENSURANCE (Phases 3 & 4)
-- ==========================================

-- Ensure commission_rate exists in payroll_configs
ALTER TABLE public.payroll_configs ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.03;
UPDATE public.payroll_configs SET commission_rate = 0.03 WHERE commission_rate IS NULL;

-- Ensure payroll_locks table exists
CREATE TABLE IF NOT EXISTS public.payroll_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT now(),
    locked_by UUID REFERENCES auth.users(id),
    UNIQUE(year, month)
);

-- ==========================================
-- 2. RLS ENABLING
-- ==========================================
ALTER TABLE public.payroll_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_locks ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. DROP OLD/CONFLICTING POLICIES
-- ==========================================

-- Payroll Configs
DROP POLICY IF EXISTS "Admin full access to payroll_configs" ON public.payroll_configs;
DROP POLICY IF EXISTS "All authenticated can read payroll_configs" ON public.payroll_configs;
DROP POLICY IF EXISTS "admin_all_payroll_configs" ON public.payroll_configs;

-- Financial Transactions
DROP POLICY IF EXISTS "Admin full access to financial_transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can see their own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "admin_all_financial_transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "users_select_own_transactions" ON public.financial_transactions;

-- Payroll Locks
DROP POLICY IF EXISTS "Admin full access to payroll_locks" ON public.payroll_locks;
DROP POLICY IF EXISTS "All can read payroll_locks" ON public.payroll_locks;
DROP POLICY IF EXISTS "admin_all_payroll_locks" ON public.payroll_locks;

-- ==========================================
-- 4. CREATE ROBUST DEFINITIVE POLICIES
-- ==========================================

-- Policy: Admin Full Access (using profile lookup for maximum reliability)
-- Applied to: laundry list of tables

-- [PAYROLL_CONFIGS]
CREATE POLICY "admin_all_payroll_configs"
ON public.payroll_configs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "everyone_select_payroll_configs"
ON public.payroll_configs FOR SELECT TO authenticated
USING (true);

-- [FINANCIAL_TRANSACTIONS]
CREATE POLICY "admin_all_financial_transactions"
ON public.financial_transactions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "users_select_own_transactions"
ON public.financial_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- [PAYROLL_LOCKS]
CREATE POLICY "admin_all_payroll_locks"
ON public.payroll_locks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "everyone_select_payroll_locks"
ON public.payroll_locks FOR SELECT TO authenticated
USING (true);

-- ==========================================
-- 5. FINALIZE
-- ==========================================
NOTIFY pgrst, 'reload config';

COMMIT;
