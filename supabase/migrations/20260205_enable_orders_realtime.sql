-- Enable Realtime for orders and order_items
begin;
  -- Try to add table to publication safely
  do $$
  begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
      alter publication supabase_realtime add table orders;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'order_items') then
      alter publication supabase_realtime add table order_items;
    end if;
  end $$;
commit;
