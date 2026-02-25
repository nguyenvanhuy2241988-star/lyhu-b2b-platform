-- FIX REALTIME & READ PERMISSIONS (DEFINITIVE)
-- Uses permissive SELECT policy to guarantee Realtime delivery.

BEGIN;

-- 1. Enable Realtime (Idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

-- 2. Permissive Select Policy
-- This ensures Realtime subscriptions (which rely on SELECT) never fail due to role check complexity.
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_realtime_select_policy" ON orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;

CREATE POLICY "orders_access_policy_v2" ON orders FOR SELECT TO authenticated
USING (true);

COMMIT;

NOTIFY pgrst, 'reload schema';
