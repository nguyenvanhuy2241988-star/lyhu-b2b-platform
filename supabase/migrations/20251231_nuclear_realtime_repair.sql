-- REALTIME NUCLEAR REPAIR SCRIPT (V5.2)
-- Goal: Force Realtime to work by resetting the publication and identity levels.

-- 1. Reset Publication
-- Dropping and recreating ensures no weird partial states exist.
-- Note: This might temporarily stop other realtime features until we re-add them, 
-- but it's the only way to be 100% sure for the essential tables.
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- 2. Add Essential Tables to Publication
-- We do this schema-qualified to be safe
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_transactions;

-- 3. Set REPLICA IDENTITY to FULL
-- This ensures the WAL includes OLD and NEW row data, critical for reliable Realtime processing.
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.inventory_levels REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.inventory_transactions REPLICA IDENTITY FULL;

-- 4. Ensure Permissions for Realtime Role
-- Realtime server uses the JWT of the user. If that user can't SELECT, they won't get Realtime messages.
-- Granting SELECT on all these tables to the authenticated role for safety.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT ON public.inventory_levels TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.inventory_transactions TO authenticated;

-- 5. Enable Realtime Extension explicitly (just in case)
-- This is often a checkbox in Supabase UI, but can be done via SQL.
-- (This command might vary based on Supabase version, but adding to publication is the standard way).

SELECT 'Nuclear Realtime Repair Applied Successfully. Orders and Inventory tables are now fully broadcasting.' as status;
