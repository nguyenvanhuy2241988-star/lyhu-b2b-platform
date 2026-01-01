-- ENABLE REALTIME FOR CRM
-- Chạy script này trong Supabase SQL Editor

-- 1. Enable Replication for crm_deals (Safe Mode)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_deals;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table crm_deals is already in publication';
END $$;

-- 2. Enable Replication for customers (Safe Mode)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE customers;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Table customers is already in publication';
END $$;

-- 3. Verify
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
