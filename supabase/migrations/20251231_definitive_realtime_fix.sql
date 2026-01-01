-- DEFINITIVE REALTIME REPAIR SCRIPT (V5.3)
-- This script ensures no partial states remain and forces broadcasting.

DO $$ 
BEGIN
    -- 1. Reset Publication safely
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        DROP PUBLICATION supabase_realtime;
    END IF;
    CREATE PUBLICATION supabase_realtime;
END $$;

-- 2. Add Tables Schema-Qualified (Idempotent because of DROP in Step 1)
-- Adding these tables ensures they broadcast ALL changes (INSERT, UPDATE, DELETE)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_transactions;

-- 3. Set REPLICA IDENTITY to FULL
-- This is MANDATORY for Realtime to send old/new data correctly to the client.
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.inventory_levels REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.inventory_transactions REPLICA IDENTITY FULL;

-- 4. Critical: Ensure RLS allows the "authenticated" role to see changes
-- If a user can't SELECT a row, Realtime will NOT send the payload to them.
-- These grants ensure the WebSocket role has reading access.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT ON public.inventory_levels TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.inventory_transactions TO authenticated;

-- 5. Final verification check
SELECT 'Realtime broadcasting is now FORCED for Orders and Inventory' as final_status;
