-- ============================================
-- Fix phantom unread chat badge
-- Root cause: last_read_at is NULL for participants who never opened a conversation
-- This counts ALL messages as "unread" even though user never interacted
-- ============================================

-- 1. IMMEDIATE FIX: Set last_read_at = now() for all participants where it's NULL
-- This clears the phantom "1 unread" for everyone
UPDATE internal_participants
SET last_read_at = now()
WHERE last_read_at IS NULL;

-- 2. DEFAULT: Ensure new participants always have last_read_at set
-- When someone is added to a conversation, they shouldn't see old messages as "unread"
ALTER TABLE internal_participants
ALTER COLUMN last_read_at SET DEFAULT now();

-- 3. Fix the get_or_create_direct_conversation RPC to set last_read_at on join
-- (The manual INSERT in chatStore.ts uses DEFAULT which is now set to now())
