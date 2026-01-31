-- Add recall and soft delete support for order messages
ALTER TABLE order_messages 
ADD COLUMN IF NOT EXISTS is_recalled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Policy update might be needed if RLS restricts updates
-- Ensure users can update their own messages for recall/delete
CREATE POLICY "Users can update their own messages"
ON order_messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);
