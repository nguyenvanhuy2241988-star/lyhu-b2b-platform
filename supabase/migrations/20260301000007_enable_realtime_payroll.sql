-- Enable Realtime for financial_transactions and telesales_tasks
-- These tables were dropped from supabase_realtime publication when 
-- 20260226000004_enable_realtime_kpi.sql did DROP/CREATE PUBLICATION.
-- This migration re-adds them safely.

-- Ensure REPLICA IDENTITY FULL for proper realtime event payloads
ALTER TABLE IF EXISTS public.financial_transactions REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.telesales_tasks REPLICA IDENTITY FULL;

-- Safely add to realtime publication (skip if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'financial_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;
    RAISE NOTICE 'Added financial_transactions to supabase_realtime';
  ELSE
    RAISE NOTICE 'financial_transactions already in supabase_realtime';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'telesales_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.telesales_tasks;
    RAISE NOTICE 'Added telesales_tasks to supabase_realtime';
  ELSE
    RAISE NOTICE 'telesales_tasks already in supabase_realtime';
  END IF;
END $$;
