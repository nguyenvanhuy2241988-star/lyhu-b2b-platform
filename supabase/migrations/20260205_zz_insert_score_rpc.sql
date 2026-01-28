-- Create RPC for inserting game score
CREATE OR REPLACE FUNCTION insert_game_score(p_game_code text, p_score int, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    INSERT INTO game_scores (game_code, score, user_id)
    VALUES (p_game_code, p_score, p_user_id)
    RETURNING to_jsonb(game_scores.*) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION insert_game_score(text, int, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_game_score(text, int, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION insert_game_score(text, int, uuid) TO anon;
