-- Add recall and soft delete support for order messages
ALTER TABLE order_messages 
ADD COLUMN IF NOT EXISTS is_recalled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Policy update might be needed if RLS restricts updates
-- Ensure users can update their own messages for recall/delete
USING (auth.uid()::text = sender_id)
WITH CHECK (auth.uid()::text = sender_id);
