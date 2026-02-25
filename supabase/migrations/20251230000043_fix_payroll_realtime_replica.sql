-- Migration: 20251230_fix_payroll_realtime_replica.sql
-- Description: Enable REPLICA IDENTITY FULL for Payroll and Orders tables to ensure Realtime filters work on updates.

-- 1. Set REPLICA IDENTITY FULL
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.financial_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.payroll_configs REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 2. Ensure tables are in the publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'financial_transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE financial_transactions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'payroll_configs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE payroll_configs;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    END IF;
END $$;

SELECT 'Realtime Replica Identity and Publication updated' as status;
