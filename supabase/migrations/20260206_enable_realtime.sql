-- Add tables to the publication to enable Realtime
BEGIN;
  -- Check if publication exists (it usually does in Supabase)
  -- We just add the tables to it.
  
  ALTER PUBLICATION supabase_realtime ADD TABLE public.recruitment_post_logs;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.recruitment_kpi_settings;
  
COMMIT;
