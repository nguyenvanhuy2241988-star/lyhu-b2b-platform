-- FIX: Force Deduplication of Direct Messages
-- Removes ALL duplicate DMs between the same two users, keeping only the most recent one.

BEGIN;

CREATE TEMP TABLE IF NOT EXISTS conversation_pairs AS
SELECT 
    c.id as conversation_id,
    c.last_message_at,
    array_agg(p.user_id ORDER BY p.user_id) as participants
FROM public.internal_conversations c
JOIN public.internal_participants p ON c.id = p.conversation_id
WHERE c.type = 'direct'
GROUP BY c.id;

-- Identify duplicates to delete
CREATE TEMP TABLE IF NOT EXISTS to_delete AS
SELECT conversation_id
FROM (
    SELECT 
        conversation_id,
        participants,
        ROW_NUMBER() OVER (PARTITION BY participants ORDER BY last_message_at DESC) as rn
    FROM conversation_pairs
) ranked
WHERE rn > 1;

-- Delete the duplicates
DELETE FROM public.internal_conversations
WHERE id IN (SELECT conversation_id FROM to_delete);

-- Select remaining count for verification (commented out for migration file)
-- SELECT count(*) FROM public.internal_conversations WHERE type = 'direct';

COMMIT;
