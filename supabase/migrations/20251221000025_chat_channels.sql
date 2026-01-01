-- Add 'channel' to type check
alter table public.internal_conversations drop constraint if exists internal_conversations_type_check;
alter table public.internal_conversations add constraint internal_conversations_type_check check (type in ('direct', 'group', 'channel'));

-- Add is_public column
alter table public.internal_conversations add column if not exists is_public boolean default false;

-- Create default channels
-- We use a DO block to insert if not exists to avoid duplicates based on name match logic for V1
do $$
begin
    if not exists (select 1 from public.internal_conversations where name = 'general' and type = 'channel') then
        insert into public.internal_conversations (type, name, is_public, last_message, last_message_at)
        values ('channel', 'general', true, 'Welcome to General Channel!', now());
    end if;

    if not exists (select 1 from public.internal_conversations where name = 'thông-báo' and type = 'channel') then
        insert into public.internal_conversations (type, name, is_public, last_message, last_message_at)
        values ('channel', 'thông-báo', true, 'Official Announcements', now());
    end if;

     if not exists (select 1 from public.internal_conversations where name = 'tán-gẫu' and type = 'channel') then
        insert into public.internal_conversations (type, name, is_public, last_message, last_message_at)
        values ('channel', 'tán-gẫu', true, 'Random chat', now());
    end if;
end $$;

-- Helper to add all users to public channels
-- This ensures RLS works for everyone immediately
insert into public.internal_participants (conversation_id, user_id, joined_at)
select c.id, u.id, now()
from public.internal_conversations c
cross join auth.users u
where c.type = 'channel' and c.is_public = true
on conflict (conversation_id, user_id) do nothing;
