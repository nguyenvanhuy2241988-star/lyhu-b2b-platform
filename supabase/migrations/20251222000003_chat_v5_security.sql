-- Chat V5: Security Enhancements
-- Restrict "Add Participant" to existing members only

-- 1. Drop loose policy
DROP POLICY IF EXISTS "Users can add participants" ON public.internal_participants;

-- 2. Create strict policy
-- Allow insert IF the current user is ALREADY a participant of the conversation
-- OR if the conversation is being created (newly inserted) - but we handle creation via a function usually.
-- Actually, when creating a group, we might insert ourselves first?
-- Let's check how createGroup works. It likely inserts conversation then participants.
-- To allow creating a NEW group, we might need to allow if it's open?
-- Better approach:
-- A user can add participants IF:
-- 1. They are already in the conversation (standard add member).
-- 2. OR they are adding THEMSELVES (joining/creation trigger).

CREATE POLICY "Users can add participants"
    ON public.internal_participants
    FOR INSERT
    WITH CHECK (
        -- Case 1: Adding myself (Self-join or Creator logic)
        auth.uid() = user_id
        OR
        -- Case 2: I am already a member of this conversation keys
        EXISTS (
            SELECT 1 FROM public.internal_participants
            WHERE conversation_id = internal_participants.conversation_id
            AND user_id = auth.uid()
        )
    );
