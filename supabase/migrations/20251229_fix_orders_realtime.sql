-- Enable Realtime for Orders, Items, and Chat
-- Run this in Supabase SQL Editor
-- This script handles cases where tables are ALREADY in the publication

DO $$
BEGIN
  -- 1. Orders Table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignore if already exists
  END;
  
  -- 2. Order Items Table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- 3. Order Messages Table (Chat)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

SELECT 'Realtime configuration checked/updated for Orders, Items, and Messages' as status;
