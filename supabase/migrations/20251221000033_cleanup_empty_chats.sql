-- FIX: Cleanup Empty / Duplicate Chats

BEGIN;

-- 1. Count before cleanup (for debugging/verification if run in SQL editor)
-- SELECT count(*) FROM public.internal_conversations WHERE type = 'direct';

-- 2. Delete conversations that have NO messages
-- This is safe because an empty chat is useless and will be re-created if needed.
-- This removes all the duplicates created by clicking "User" multiple times.
DELETE FROM public.internal_conversations
WHERE type = 'direct'
AND NOT EXISTS (
    SELECT 1 FROM public.internal_messages
    WHERE conversation_id = internal_conversations.id
);

-- 3. (Optional) Delete orphan participants (cascade should handle this, but good to ensure)
-- DELETE FROM public.internal_participants
-- WHERE conversation_id NOT IN (SELECT id FROM public.internal_conversations);

COMMIT;
