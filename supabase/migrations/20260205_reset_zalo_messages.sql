-- Clean up all synced messages to start fresh with Extension V2
TRUNCATE TABLE zalo_messages;

-- Optionally reset account timestamps if you want
UPDATE zalo_sync_accounts SET last_synced_at = NULL;
