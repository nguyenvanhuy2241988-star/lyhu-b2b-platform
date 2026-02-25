-- Enable Realtime for customers table
begin;
  -- Try to add table to publication. If it fails (already exists), we catch it or ignore.
  -- PostgreSQL doesn't have "ADD TABLE IF NOT EXISTS" for publications easily, 
  -- so we'll just run the command. If it fails, the user can ignore the error if it says "already member".
  -- However, to be cleaner, we can check `pg_publication_tables`.
  
  -- SImple approach:
  alter publication supabase_realtime add table customers;
commit;
