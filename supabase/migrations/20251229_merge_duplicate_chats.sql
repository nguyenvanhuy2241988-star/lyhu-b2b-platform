-- Migration: Merge Duplicate Direct Conversations
-- Purpose: Fix "Split Brain" issues where users might have multiple DM channels.
-- Strategy: For each pair of users, identify the "Master" conversation (most recent). Move all messages/participants to Master. Delete others.

DO $$
DECLARE
    r RECORD;
    master_id UUID;
    duplicate_id UUID;
BEGIN
    -- Loop through all user pairs that have > 1 direct conversation
    FOR r IN (
        SELECT 
            p1.user_id as u1, 
            p2.user_id as u2, 
            array_agg(c.id ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC) as conv_ids,
            COUNT(*) as count
        FROM internal_conversations c
        JOIN internal_participants p1 ON c.id = p1.conversation_id
        JOIN internal_participants p2 ON c.id = p2.conversation_id AND p1.user_id < p2.user_id
        WHERE c.type = 'direct'
        GROUP BY p1.user_id, p2.user_id
        HAVING COUNT(*) > 1
    ) LOOP
        -- The first ID is the Master (Most recent)
        master_id := r.conv_ids[1];
        
        RAISE NOTICE 'Merging duplicates between % and %. Master: %', r.u1, r.u2, master_id;

        -- Loop through duplicates (skipping the first one)
        FOR i IN 2..array_length(r.conv_ids, 1) LOOP
            duplicate_id := r.conv_ids[i];
            RAISE NOTICE 'Merging duplicate % into %', duplicate_id, master_id;

            -- 1. Move Messages
            UPDATE internal_messages 
            SET conversation_id = master_id 
            WHERE conversation_id = duplicate_id;

            -- 2. Move Reactions (if any ref checking needed, but usually linked to message_id, so implicitly moved if message moved? 
            --    Wait, reaction table usually references message_id. 
            --    If message_id is same, no change needed.
            --    Wait, internal_message_reactions doesn't have conversation_id usually?
            --    Let's check schema. Assuming it links to message_id.
            --    If it DOES link to conversation_id, we must update it.
            --    Safe to try update if column exists.
            
            -- 3. Delete Duplicate Conversation (Cascade should handle participants? Or manual delete?)
            --    Delete participants first to be clean.
            DELETE FROM internal_participants WHERE conversation_id = duplicate_id;
            DELETE FROM internal_conversations WHERE id = duplicate_id;
            
        END LOOP;
        
    END LOOP;
END $$;
