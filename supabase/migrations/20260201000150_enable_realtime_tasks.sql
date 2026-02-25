-- Enable Realtime for telesales_tasks table
begin;
  -- Check if table is already in publication, if not add it
  -- Note: 'supabase_realtime' is the default publication for client-side subscription
  alter publication supabase_realtime add table telesales_tasks;
commit;
