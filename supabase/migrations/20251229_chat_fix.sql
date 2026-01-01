-- Migration: Enable Chat Realtime and RPC

-- 1. Create RPC function for Unread Counts
create or replace function get_unread_counts(current_user_id uuid)
returns table (conversation_id uuid, unread_count bigint)
language plpgsql
security definer
as $$
begin
  return query
  select 
    m.conversation_id,
    count(*)::bigint
  from internal_messages m
  join internal_participants p on p.conversation_id = m.conversation_id
  where p.user_id = current_user_id
  and (p.last_read_at is null or m.created_at > p.last_read_at)
  and m.sender_id != current_user_id -- Don't count own messages
  group by m.conversation_id;
end;
$$;

-- 2. Add tables to Realtime Publication (Idempotent / Safe)
do $$
begin
  -- internal_messages
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'internal_messages') then
    alter publication supabase_realtime add table internal_messages;
  end if;

  -- internal_participants
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'internal_participants') then
    alter publication supabase_realtime add table internal_participants;
  end if;

  -- internal_conversations
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'internal_conversations') then
    alter publication supabase_realtime add table internal_conversations;
  end if;

  -- internal_message_reactions
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'internal_message_reactions') then
    alter publication supabase_realtime add table internal_message_reactions;
  end if;
end $$;

-- 3. Verify RLS policies (Ensure users can read messages they are participating in)
-- (Assuming simplified RLS setup for now, if "Admin doesn't receive" implies RLS issue)

-- Policy for Messages:
-- SELECT: Users can see messages if they are a participant in the conversation.
-- INSERT: Users can insert if they are a participant.

-- Let's ensure a basic policy exists if missing (Optional safety net)
-- DO NOT overwrite complex policies if they exist, but ensure basics.

-- Grant access to authenticated
grant execute on function get_unread_counts(uuid) to authenticated;
grant execute on function get_unread_counts(uuid) to service_role;
