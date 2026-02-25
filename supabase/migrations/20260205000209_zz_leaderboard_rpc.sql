-- Create RPC for simple leaderboard fetching
-- Bypasses PostgREST embedding issues (406 error)

CREATE OR REPLACE FUNCTION get_game_leaderboard_simple(p_game_code text, p_limit int DEFAULT 10)
RETURNS TABLE (
    id uuid,
    game_code text,
    user_id uuid,
    score int,
    played_at timestamptz,
    full_name text,
    avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.id,
        gs.game_code,
        gs.user_id,
        gs.score,
        gs.played_at,
        p.full_name,
        p.avatar_url
    FROM game_scores gs
    JOIN profiles p ON gs.user_id = p.id
    WHERE gs.game_code = p_game_code
    ORDER BY gs.score DESC
    LIMIT p_limit;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_game_leaderboard_simple(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_game_leaderboard_simple(text, int) TO service_role;
GRANT EXECUTE ON FUNCTION get_game_leaderboard_simple(text, int) TO anon;
