-- Force Schema Reload and Standardize FK
-- Fixes 406 Not Acceptable error on Leaderboard
-- Reason: PostgREST cache might be stale, or relationship name inferred incorrectly

BEGIN;

-- 1. Drop existing constraint if it exists (auto-generated name usually)
-- We try to guess the name or just drop by column if we could, but constraint names are specific.
-- Re-defining the FK with EXPLICIT name helps PostgREST find it.

ALTER TABLE public.game_scores DROP CONSTRAINT IF EXISTS game_scores_user_id_fkey;

ALTER TABLE public.game_scores 
    ADD CONSTRAINT game_scores_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

-- 2. Notify reload (Optional, usually DDL triggers it automatically)
NOTIFY pgrst, 'reload schema';

COMMIT;
