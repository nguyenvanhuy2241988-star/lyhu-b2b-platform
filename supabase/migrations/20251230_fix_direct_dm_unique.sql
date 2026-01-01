-- 1) Add direct_key to conversations
alter table public.internal_conversations
add column if not exists direct_key text;

-- 2) Backfill direct_key for existing direct conversations (only those with exactly 2 participants)
with pairs as (
  select
    conversation_id,
    (array_agg(user_id order by user_id))[1] as u1,
    (array_agg(user_id order by user_id))[2] as u2,
    count(*) as cnt
  from public.internal_participants
  group by conversation_id
)
update public.internal_conversations c
set direct_key = (pairs.u1::text || '_' || pairs.u2::text)
from pairs
where c.id = pairs.conversation_id
  and c.type = 'direct'
  and pairs.cnt = 2
  and c.direct_key is null;

-- 3) Merge duplicates by direct_key (keep newest by last_message_at)
do $$
declare
  r record;
  keep_id uuid;
  lose_id uuid;
begin
  for r in
    select direct_key
    from public.internal_conversations
    where direct_key is not null
    group by direct_key
    having count(*) > 1
  loop
    select id into keep_id
    from public.internal_conversations
    where direct_key = r.direct_key
    order by coalesce(last_message_at, created_at) desc
    limit 1;

    for lose_id in
      select id
      from public.internal_conversations
      where direct_key = r.direct_key
        and id <> keep_id
    loop
      -- move messages
      update public.internal_messages
      set conversation_id = keep_id
      where conversation_id = lose_id;

      -- move participants (avoid duplicates)
      insert into public.internal_participants(conversation_id, user_id)
      select keep_id, p.user_id
      from public.internal_participants p
      where p.conversation_id = lose_id
      on conflict do nothing;

      delete from public.internal_participants where conversation_id = lose_id;
      delete from public.internal_conversations where id = lose_id;
    end loop;
  end loop;
end $$;

-- 4) Create unique index (direct_key must be unique when present)
create unique index if not exists internal_conversations_direct_key_ux
on public.internal_conversations (direct_key)
where direct_key is not null;

-- 5) RPC: get-or-create DM safely
create or replace function public.get_or_create_direct_conversation(target_user_id uuid)
returns uuid
language plpgsql
as $$
declare
  me uuid := auth.uid();
  low uuid;
  high uuid;
  k text;
  conv_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;
  if target_user_id = me then
    raise exception 'Cannot create direct conversation with yourself';
  end if;

  low := least(me, target_user_id);
  high := greatest(me, target_user_id);
  k := low::text || '_' || high::text;

  insert into public.internal_conversations(type, created_by, is_public, name, direct_key, last_message_at)
  values ('direct', me, false, null, k, now())
  on conflict (direct_key) do update
    set last_message_at = greatest(public.internal_conversations.last_message_at, excluded.last_message_at)
  returning id into conv_id;

  insert into public.internal_participants(conversation_id, user_id)
  values (conv_id, me), (conv_id, target_user_id)
  on conflict do nothing;

  return conv_id;
end $$;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
