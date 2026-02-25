-- Internal Chat Schema

-- 1. Conversations
create table if not exists public.internal_conversations (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    type text default 'direct' check (type in ('direct', 'group')),
    name text, -- For group chats
    last_message text,
    last_message_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Participants
create table if not exists public.internal_participants (
    conversation_id uuid references public.internal_conversations(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_read_at timestamp with time zone default timezone('utc'::text, now()),
    primary key (conversation_id, user_id)
);

-- 3. Messages
create table if not exists public.internal_messages (
    id uuid default gen_random_uuid() primary key,
    conversation_id uuid references public.internal_conversations(id) on delete cascade not null,
    sender_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_system boolean default false
);

-- Enable Realtime
alter publication supabase_realtime add table public.internal_messages;
alter publication supabase_realtime add table public.internal_conversations;

-- RLS
alter table public.internal_conversations enable row level security;
alter table public.internal_participants enable row level security;
alter table public.internal_messages enable row level security;

-- Policies

-- Conversations: Visible if you are a participant
drop policy if exists "Users can view conversations they are in" on public.internal_conversations;
create policy "Users can view conversations they are in"
    on public.internal_conversations for select
    using (
        exists (
            select 1 from public.internal_participants
            where conversation_id = internal_conversations.id
            and user_id = auth.uid()
        )
    );
    
drop policy if exists "Users can create conversations" on public.internal_conversations;
create policy "Users can create conversations"
    on public.internal_conversations for insert
    with check (true);

drop policy if exists "Users can update conversations they are in" on public.internal_conversations;
create policy "Users can update conversations they are in"
    on public.internal_conversations for update
    using (
        exists (
            select 1 from public.internal_participants
            where conversation_id = internal_conversations.id
            and user_id = auth.uid()
        )
    );

-- Participants: Visible if you share a conversation or it's you
drop policy if exists "Users can view participants of their conversations" on public.internal_participants;
create policy "Users can view participants of their conversations"
    on public.internal_participants for select
    using (
        user_id = auth.uid() or
        conversation_id in (
            select conversation_id from public.internal_participants where user_id = auth.uid()
        )
    );

drop policy if exists "Users can add participants" on public.internal_participants;
create policy "Users can add participants"
    on public.internal_participants for insert
    with check (true); -- Ideally stricter, but open for V1 simplicity

drop policy if exists "Users can update their own read status" on public.internal_participants;
create policy "Users can update their own read status"
    on public.internal_participants for update
    using (user_id = auth.uid());

-- Messages: Visible if you are a participant of the conversation
drop policy if exists "Users can view messages in their conversations" on public.internal_messages;
create policy "Users can view messages in their conversations"
    on public.internal_messages for select
    using (
        exists (
            select 1 from public.internal_participants
            where conversation_id = internal_messages.conversation_id
            and user_id = auth.uid()
        )
    );

drop policy if exists "Users can insert messages to their conversations" on public.internal_messages;
create policy "Users can insert messages to their conversations"
    on public.internal_messages for insert
    with check (
        auth.uid() = sender_id and
        exists (
            select 1 from public.internal_participants
            where conversation_id = internal_messages.conversation_id
            and user_id = auth.uid()
        )
    );
