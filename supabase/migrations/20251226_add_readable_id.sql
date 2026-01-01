-- Add readable_id to orders
-- Run in Supabase SQL Editor

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'readable_id') THEN
        ALTER TABLE orders ADD COLUMN readable_id SERIAL;
    END IF;
END $$;

SELECT 'Added readable_id successfully' as status;
