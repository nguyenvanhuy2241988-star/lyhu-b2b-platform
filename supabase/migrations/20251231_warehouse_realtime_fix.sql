-- Warehouse & Orders Realtime Definitive Fix
-- Version 1.0

-- 1. Force REPLICA IDENTITY FULL for all relevant tables
-- This is critical for Realtime to send the full row data on updates/deletes
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.inventory_levels REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- 2. Ensure Publication includes these tables (Idempotent)
DO $$
BEGIN
    -- Check and add orders
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;

    -- Check and add order_items
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'order_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
    END IF;

    -- Check and add inventory_levels
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_levels') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE inventory_levels;
    END IF;

EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Notice: Could not modify publication. Please ensure you are using a Postgres role with publication permissions.';
END $$;
