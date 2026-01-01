-- Function to get unread counts for a user
create or replace function get_unread_counts(current_user_id uuid)
returns table (
    conversation_id uuid,
    unread_count bigint
) 
language plpgsql
security definer
as $$
begin
    return query
    select 
        m.conversation_id,
        count(*) as unread_count
    from 
        internal_messages m
    join 
        internal_participants p on m.conversation_id = p.conversation_id
    where 
        p.user_id = current_user_id
        and m.created_at > p.last_read_at
    group by 
        m.conversation_id;
end;
$$;
