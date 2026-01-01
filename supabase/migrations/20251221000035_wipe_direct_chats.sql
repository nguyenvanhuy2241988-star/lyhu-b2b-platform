-- FIX: NUCLEAR WIPE of Direct Messages
-- The database state for DMs is inconsistent (duplicates, orphaned participants, 1-person chats).
-- This script DELETES ALL Direct Messages to reset the state.
-- Public Channels (#general, etc.) are NOT affected.

BEGIN;

DELETE FROM public.internal_conversations
WHERE type = 'direct';

-- Participants and Messages will be deleted automatically via CASCADE
-- (defined in schema: on delete cascade)

COMMIT;
