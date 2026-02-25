-- Chat V3 Phase 1: Reply, Edit, Delete Support

BEGIN;

-- Add columns for Reply, Edit, Delete
ALTER TABLE public.internal_messages
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.internal_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Enhance RLS Policy for Updates (Edit/Delete)
-- Only sender can update their own messages
drop policy if exists "Users can update their own messages" on public.internal_messages;
CREATE POLICY "Users can update their own messages"
ON public.internal_messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

COMMIT;
