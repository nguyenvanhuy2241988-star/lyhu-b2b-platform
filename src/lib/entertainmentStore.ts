
import { createClient } from './supabaseClient';

export interface GameScore {
    id: string;
    game_code: string;
    user_id: string;
    score: number;
    played_at: string;
    user?: {
        full_name: string;
        avatar_url?: string;
    };
}

const supabase = createClient();

export const saveGameScore = async (gameCode: string, score: number, userId: string) => {
    const { data, error } = await supabase
        .from('game_scores')
        .insert([{ game_code: gameCode, score, user_id: userId }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getLeaderboard = async (gameCode: string, limit = 10) => {
    // Determine start of week (Monday)
    // For simplicity in this MVP, we fetch all-time high scores
    // Or we can filter by date in JS if needed, but SQL RLS/Filter is better for scale.
    // Here we get Top scores DESC.

    const { data, error } = await supabase
        .from('game_scores')
        .select(`
            *,
            user:profiles(full_name, avatar_url)
        `)
        .eq('game_code', gameCode)
        .order('score', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as GameScore[];
};

export const getMyBestScore = async (gameCode: string, userId: string) => {
    const { data, error } = await supabase
        .from('game_scores')
        .select('score')
        .eq('game_code', gameCode)
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // 116 is no rows
    return data?.score || 0;
};
