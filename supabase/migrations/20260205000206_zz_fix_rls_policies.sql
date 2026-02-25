-- Fix RLS Policies for game_scores
-- Ensure users can actually save their scores!

BEGIN;

-- 1. Enable RLS (Good practice, ensures no accidental public writes)
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh (avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.game_scores;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.game_scores;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.game_scores;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.game_scores;

-- 3. Create Policy: READ (Everyone can see leaderboard)
CREATE POLICY "Enable read access for all users"
ON public.game_scores FOR SELECT
USING (true);

-- 4. Create Policy: INSERT (Users can save their own score)
CREATE POLICY "Enable insert for users based on user_id"
ON public.game_scores FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Create Policy: UPDATE (Users can update their own score - though we usually insert new rows usually)
CREATE POLICY "Enable update for users based on user_id"
ON public.game_scores FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMIT;
