-- Enable REPLICA IDENTITY FULL for fund_transactions to support realtime UPDATE/DELETE events
ALTER TABLE public.fund_transactions REPLICA IDENTITY FULL;

-- Also enable for fund_contributions and app_settings
ALTER TABLE public.fund_contributions REPLICA IDENTITY FULL;
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;

-- Ensure app_settings is in realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
EXCEPTION WHEN duplicate_object THEN
    -- Already exists, skip
END $$;
