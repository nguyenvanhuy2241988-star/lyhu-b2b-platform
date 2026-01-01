
BEGIN;
  -- 1. Ensure orders table is in the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

  -- 2. DANGEROUS: Disable RLS explicitly to allow anon access (for debugging)
  ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
  ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
COMMIT;
