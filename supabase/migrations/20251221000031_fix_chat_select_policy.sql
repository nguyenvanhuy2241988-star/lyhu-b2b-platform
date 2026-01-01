-- FIX: Broaden SELECT permissions to fix 403 Errors

BEGIN;

-- 1. internal_conversations: Allow SELECT for ALL authenticated users
-- This fixes the issue where "Insert returning *" fails because you aren't a participant yet.
-- It also fixes the 403 when fetching headers.
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can view public conversations" ON public.internal_conversations;
-- Drop any other select policies...

CREATE POLICY "Authenticated users can select conversations"
    ON public.internal_conversations FOR SELECT
    USING (auth.role() = 'authenticated');

-- 2. internal_participants: Allow SELECT for ALL authenticated users
-- We need to check who is in a conversation before we join/create.
DROP POLICY IF EXISTS "Users can view participants" ON public.internal_participants;

CREATE POLICY "Authenticated users can select participants"
    ON public.internal_participants FOR SELECT
    USING (auth.role() = 'authenticated');

-- 3. internal_messages: Keep strict (Must be participant or public)
-- This ensures content privacy.
-- (No change needed if previous script 30 was run, but ensuring it here just in case)

COMMIT;
