-- Clean up duplicate RLS policies for internal_messages
-- This migration drops ALL existing policies and creates clean, non-conflicting ones

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can view messages" ON public.internal_messages;
DROP POLICY IF EXISTS "auth_all_messages" ON public.internal_messages;
DROP POLICY IF EXISTS "delete_messages_owner" ON public.internal_messages;
DROP POLICY IF EXISTS "insert_messages_participants" ON public.internal_messages;
DROP POLICY IF EXISTS "select_messages_participants" ON public.internal_messages;
DROP POLICY IF EXISTS "update_messages_owner" ON public.internal_messages;

-- ============================================
-- ENSURE RLS IS ENABLED
-- ============================================
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE CLEAN POLICIES (ONE PER OPERATION)
-- ============================================

-- SELECT: User can view messages if they are participant in the conversation
CREATE POLICY "messages_select_participant"
ON public.internal_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.internal_participants p
        WHERE p.conversation_id = internal_messages.conversation_id
        AND p.user_id = auth.uid()
    )
);

-- INSERT: User can send messages if they are participant in the conversation
CREATE POLICY "messages_insert_participant"
ON public.internal_messages
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.internal_participants p
        WHERE p.conversation_id = internal_messages.conversation_id
        AND p.user_id = auth.uid()
    )
    AND sender_id = auth.uid()
);

-- UPDATE: User can only update their own messages
CREATE POLICY "messages_update_owner"
ON public.internal_messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- DELETE: User can only delete their own messages
CREATE POLICY "messages_delete_owner"
ON public.internal_messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- ============================================
-- VERIFY: List final policies
-- ============================================
-- Run this to verify:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'internal_messages';
