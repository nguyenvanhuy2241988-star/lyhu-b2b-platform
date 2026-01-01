-- 1. Update RLS for Conversations to allow reading public channels
drop policy if exists "Users can view conversations they are in" on public.internal_conversations;

create policy "Users can view conversations"
    on public.internal_conversations for select
    using (
        is_public = true or
        exists (
            select 1 from public.internal_participants
            where conversation_id = internal_conversations.id
            and user_id = auth.uid()
        )
    );

-- 2. Update RLS for Participants to allow adding self to public channels
drop policy if exists "Users can add participants" on public.internal_participants;

create policy "Users can add participants"
    on public.internal_participants for insert
    with check (
        -- Allow if adding yourself to a public channel
        (user_id = auth.uid() and exists (
            select 1 from public.internal_conversations
            where id = conversation_id and is_public = true
        ))
        or
        -- Or simple existing logic (open for V1)
        true
    );

-- 3. Update RLS for Messages to allow viewing public channel messages (Optional, but good for preview)
-- For now, we keep messages strictly for participants, so the "Auto-join on Send" logic in Store is important.
-- However, to SEE history before joining, we might want this. Let's start with strict -> must join to see.
-- But wait, my Store fetches messages upon selection. If I am not a participant, RLS blocks messages.
-- So I should probably allow viewing messages of public channels too.

drop policy if exists "Users can view messages in their conversations" on public.internal_messages;

create policy "Users can view messages"
    on public.internal_messages for select
    using (
        exists (
            select 1 from public.internal_conversations
            where id = internal_messages.conversation_id
            and is_public = true
        )
        or
        exists (
            select 1 from public.internal_participants
            where conversation_id = internal_messages.conversation_id
            and user_id = auth.uid()
        )
    );
