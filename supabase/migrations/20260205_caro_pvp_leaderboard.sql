-- Migration: Add Caro PvP & Aggregated Leaderboard
-- Purpose: Enable PvP Leaderboard (Total Wins)

-- 1. Register 'caro_pvp' game code
INSERT INTO public.entertainment_games (code, name, description, icon_name, config) VALUES
('caro_pvp', 'Caro PvP (Thách Đấu)', 'Bảng xếp hạng thắng thua PvP', 'Swords', null)
ON CONFLICT (code) DO NOTHING;

-- 2. Create Aggregated Leaderboard Function (Total Score/Wins)
-- This sums up the scores for each user for a specific game code.
-- Useful for "Total Wins" where we insert a row with score=1 for each win.

CREATE OR REPLACE FUNCTION public.get_accumulated_leaderboard(p_game_code text, p_limit int DEFAULT 10)
RETURNS TABLE (
    user_id uuid,
    total_score bigint,
    full_name text,
    avatar_url text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        s.user_id,
        SUM(s.score) as total_score,
        p.full_name,
        p.avatar_url
    FROM public.game_scores s
    JOIN public.profiles p ON s.user_id = p.id
    WHERE s.game_code = p_game_code
    GROUP BY s.user_id, p.full_name, p.avatar_url
    ORDER BY total_score DESC
    LIMIT p_limit;
$$;
