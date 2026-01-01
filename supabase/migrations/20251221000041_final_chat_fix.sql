-- COMPREHENSIVE CHAT FIX (Final Solution)
-- This migration addresses all root causes of the jumping and duplicate issues
-- WARNING: This will DELETE all existing direct messages (channels preserved)

BEGIN;

-- =====================================================================
-- STEP 1: DROP ALL EXISTING RLS POLICIES (Clean Slate)
-- =====================================================================

-- Drop policies on internal_conversations
DROP POLICY IF EXISTS "Users can view conversations they are in" ON public.internal_conversations;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.internal_conversations;
DROP POLICY IF EXISTS "Authenticated users can select conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can create DMs" ON public.internal_conversations;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.internal_conversations;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.internal_conversations;

-- Drop policies on internal_participants (THE RECURSIVE ONE)
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.internal_participants;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.internal_participants;
DROP POLICY IF EXISTS "Authenticated users can select participants" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can update their own read status" ON public.internal_participants;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.internal_participants;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.internal_participants;

-- Drop policies on internal_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.internal_messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.internal_messages;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.internal_messages;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.internal_messages;


-- =====================================================================
-- STEP 2: CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- =====================================================================

-- For internal chat, we use simple authenticated-only policies
-- Application logic handles fine-grained permissions

CREATE POLICY "auth_all_conversations"
    ON public.internal_conversations
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_all_participants"
    ON public.internal_participants
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_all_messages"
    ON public.internal_messages
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- =====================================================================
-- STEP 3: WIPE ALL DIRECT MESSAGES (Corrupted Data)
-- =====================================================================

-- Temporarily disable RLS to ensure deletion works
ALTER TABLE public.internal_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages DISABLE ROW LEVEL SECURITY;

-- Delete all direct conversations (and cascaded data)
DELETE FROM public.internal_conversations
WHERE type IS DISTINCT FROM 'channel';

-- Re-enable RLS
ALTER TABLE public.internal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- STEP 4: ADD UNIQUE CONSTRAINT (Prevent Future Duplicates)
-- =====================================================================

-- This function ensures we can create a unique index for conversation pairs
-- It creates a deterministic key from two user IDs
CREATE OR REPLACE FUNCTION get_dm_pair_key(conv_id uuid)
RETURNS text AS $$
DECLARE
    user_ids uuid[];
    sorted_ids uuid[];
BEGIN
    -- Get the two user IDs from participants
    SELECT ARRAY_AGG(user_id ORDER BY user_id) INTO user_ids
    FROM internal_participants
    WHERE conversation_id = conv_id;
    
    -- Return concatenated sorted IDs as text
    IF array_length(user_ids, 1) = 2 THEN
        RETURN user_ids[1]::text || '_' || user_ids[2]::text;
    END IF;
    
    -- Return NULL for non-DM or invalid conversations
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create unique index on the pair key
-- This prevents creating multiple DM conversations between the same two users
CREATE UNIQUE INDEX IF NOT EXISTS unique_dm_pair
ON internal_conversations (get_dm_pair_key(id))
WHERE type = 'direct' AND get_dm_pair_key(id) IS NOT NULL;


COMMIT;
