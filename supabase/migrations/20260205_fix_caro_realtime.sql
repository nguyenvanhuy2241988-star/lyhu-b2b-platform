-- Migration: Enable Realtime for Caro Rooms
-- Purpose: Fix issue where players don't see updates (Join/Move) instantly.

-- 1. Add table to supabase_realtime publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.caro_rooms, public.point_transactions, public.entertainment_games;
commit;

-- ALTERNATIVE (If you don't want to recreate the whole pub):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.caro_rooms;

-- Let's try the safer "ADD" approach if it exists, but usually "supabase_realtime" is the default.
-- To be safe and idempotent:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'caro_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.caro_rooms;
  END IF;
END
$$;
