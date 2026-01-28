-- Enable replication for order_messages table to allow Realtime subscriptions
alter publication supabase_realtime add table order_messages;

-- Ensure RLS allows reading messages (already double checked generally, but this ensures policy exists)
-- This is just a safety check comment, the main action is above.
