-- FIX: FINAL NUCLEAR WIPE (V2)
-- Previous script might have missed rows where type is NULL.
-- This script deletes ALL conversations that are NOT explicitly 'channel'.

BEGIN;

DELETE FROM public.internal_conversations
WHERE type IS DISTINCT FROM 'channel'; 
-- "IS DISTINCT FROM" handles NULLs correctly (NULL != 'channel' is unknown, but IS DISTINCT FROM 'channel' is true).
-- Alternatively: WHERE type = 'direct' OR type IS NULL OR type = 'group';

-- Check for any orphaned participants afterwards
DELETE FROM public.internal_participants
WHERE conversation_id NOT IN (SELECT id FROM public.internal_conversations);

-- Check for any orphaned messages
DELETE FROM public.internal_messages
WHERE conversation_id NOT IN (SELECT id FROM public.internal_conversations);

COMMIT;
