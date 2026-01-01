-- Enable Realtime for Inventory Tables
-- Run this in Supabase SQL Editor

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_transactions;

SELECT 'Realtime enabled for inventory_levels and inventory_transactions' as status;
