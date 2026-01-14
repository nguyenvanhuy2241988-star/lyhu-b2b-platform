
-- Add UNIQUE constraint to social_messages.external_id to support UPSERT (Sync)
-- This ensures we don't create duplicate messages when syncing historical data.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_messages_external_id_key') THEN
        ALTER TABLE social_messages ADD CONSTRAINT social_messages_external_id_key UNIQUE (external_id);
    END IF;
END $$;
