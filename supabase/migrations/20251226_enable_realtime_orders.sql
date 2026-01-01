
-- Enable Realtime for orders table
BEGIN;
  -- Check if publication exists (it should by default in Supabase)
  -- Add table to publication
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
COMMIT;
