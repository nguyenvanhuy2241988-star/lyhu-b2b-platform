-- Enable Realtime for Game Scores
BEGIN;

-- 1. Set Replica Identity (Best practice for Realtime)
ALTER TABLE public.game_scores REPLICA IDENTITY FULL;

-- 2. Add to publication
-- We use a 'do' block or ignore error if already added, but standard way is:
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;

COMMIT;
