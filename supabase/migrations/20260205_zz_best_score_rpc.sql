-- Create RPC for getting best score
CREATE OR REPLACE FUNCTION get_my_best_score(p_game_code text, p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_score int;
BEGIN
    SELECT score INTO v_score
    FROM game_scores
    WHERE game_code = p_game_code AND user_id = p_user_id
    ORDER BY score DESC
    LIMIT 1;
    
    RETURN COALESCE(v_score, 0);
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_my_best_score(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_best_score(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION get_my_best_score(text, uuid) TO anon;
