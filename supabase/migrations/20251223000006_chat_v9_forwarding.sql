-- Add is_forwarded column to internal_messages
ALTER TABLE internal_messages
ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT FALSE;

-- We could also add original_sender_id if we want "Forwarded from X", but simple "Forwarded" label is standard V1.
