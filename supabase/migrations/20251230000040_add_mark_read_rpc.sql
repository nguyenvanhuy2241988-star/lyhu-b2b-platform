-- Function to mark a conversation as read for a user
create or replace function mark_conversation_read(
  p_conversation_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update internal_participants
  set last_read_at = now()
  where conversation_id = p_conversation_id
  and user_id = p_user_id;
end;
$$;
