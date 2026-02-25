-- Enable Realtime for HR Scheduling tables
BEGIN;

-- Check if tables exist first to be safe (they should)
-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.culture_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_transactions;

COMMIT;
