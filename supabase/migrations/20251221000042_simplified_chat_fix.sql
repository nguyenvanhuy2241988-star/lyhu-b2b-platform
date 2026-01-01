-- SIMPLIFIED COMPREHENSIVE CHAT FIX (v2)
-- Removed complex unique constraint that caused IMMUTABLE error
-- This migration fixes RLS policies and wipes corrupted data

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
DROP POLICY IF EXISTS "auth_all_conversations" ON public.internal_conversations;

-- Drop policies on internal_participants (THE RECURSIVE ONE)
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.internal_participants;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.internal_participants;
DROP POLICY IF EXISTS "Authenticated users can select participants" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can update their own read status" ON public.internal_participants;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.internal_participants;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.internal_participants;
DROP POLICY IF EXISTS "auth_all_participants" ON public.internal_participants;

-- Drop policies on internal_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.internal_messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.internal_messages;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.internal_messages;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.internal_messages;
DROP POLICY IF EXISTS "auth_all_messages" ON public.internal_messages;

-- Drop old function if exists
DROP FUNCTION IF EXISTS get_dm_pair_key(uuid);
DROP INDEX IF EXISTS unique_dm_pair;


-- =====================================================================
-- STEP 2: TEMPORARILY DISABLE RLS TO ENSURE WIPE WORKS
-- =====================================================================

ALTER TABLE public.internal_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages DISABLE ROW LEVEL SECURITY;


-- =====================================================================
-- STEP 3: WIPE ALL DIRECT MESSAGES (Corrupted Data)
-- =====================================================================

-- Delete all direct conversations (cascades to participants and messages)
DELETE FROM public.internal_conversations
WHERE type IS DISTINCT FROM 'channel';


-- =====================================================================
-- STEP 4: RE-ENABLE RLS
-- =====================================================================

ALTER TABLE public.internal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- STEP 5: CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
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


COMMIT;
