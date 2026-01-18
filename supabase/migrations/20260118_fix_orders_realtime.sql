-- FIX REALTIME UPDATES FOR ORDERS
-- 1. Ensure 'orders' table is in the realtime publication
-- 2. Simplify RLS SELECT policy to ensure events are delivered to all roles

BEGIN;

-- 1. Enable Realtime for orders table (Safe Idempotent Check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

-- 2. Fix RLS Policy for SELECT (Used by Realtime)
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "orders_read_policy" ON orders;
DROP POLICY IF EXISTS "allow_select" ON orders;

-- Create a robust SELECT policy
-- Admin, Warehouse, Accountant, Sale Admin: See ALL
-- Telesales: See OWN
CREATE POLICY "orders_realtime_select_policy" ON orders FOR SELECT TO authenticated
USING (
    -- High privilege roles see everything
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warehouse', 'accountant', 'sale_admin')
    OR 
    -- Telesales sees their own
    telesales_user_id = auth.uid()
    OR
    -- If no role found (fallback), generic authenticated check? No, strictly role based.
    -- But what if profile lookup fails?
    -- Let's add a "safety valve" if needed, but the above is standard.
    false
);

-- Note: We do NOT need to fix INSERT/UPDATE policies here as those are handled by RPCs now.
-- Realtime only cares about SELECT visibility.

COMMIT;

NOTIFY pgrst, 'reload schema';
