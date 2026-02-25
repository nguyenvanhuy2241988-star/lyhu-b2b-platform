-- Enable REPLICA IDENTITY FULL for telesales_tasks
-- This ensures that Supabase Realtime sends the full row in payload.new for UPDATE events,
-- preventing "missing" fields (undefined) which lead to data reversion on the client side.

ALTER TABLE public.telesales_tasks REPLICA IDENTITY FULL;
