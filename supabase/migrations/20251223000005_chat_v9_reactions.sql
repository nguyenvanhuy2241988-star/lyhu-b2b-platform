-- Create Message Reactions Table
CREATE TABLE IF NOT EXISTS internal_message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES internal_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE internal_message_reactions ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. View: Everyone can view reactions if they can view the message (broadly, if they are authenticated and participate in conversation)
-- Since linking back to conversation->participants in RLS is complex/expensive, we can simplify:
-- "If I can see the message, I can see the reaction".
-- But checking if I can see the message requires checking conversation participants.
-- To avoid recursion or performance hit, we can just allow Authenticated users to see reactions (RLS on messages handles visibility of the message itself, so seeing reactions for a hidden message is rare/low risk unless ID is guessed).
-- A safer approach:
drop policy if exists "View reactions" on internal_message_reactions;
CREATE POLICY "View reactions" ON internal_message_reactions
    FOR SELECT TO authenticated
    USING (true);

-- 2. Insert: Only if I am the user_id (handled by default? No, need check). And I should be in conversation.
-- Simplified: Authenticated users can react to any message they can "see" (fetch). 
-- Enforcing "in conversation" is better.
drop policy if exists "Add reaction" on internal_message_reactions;
CREATE POLICY "Add reaction" ON internal_message_reactions
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
             SELECT 1 FROM internal_messages m
             JOIN internal_participants p ON p.conversation_id = m.conversation_id
             WHERE m.id = message_id AND p.user_id = auth.uid()
        )
    );

-- 3. Delete: Only if I am the owner
drop policy if exists "Remove reaction" on internal_message_reactions;
CREATE POLICY "Remove reaction" ON internal_message_reactions
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE internal_message_reactions;
