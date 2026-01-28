
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

    // Use RPC to bypass PostgREST embedding issues (406 Not Acceptable)
    const { data, error } = await supabase.rpc('get_game_leaderboard_simple', {
        p_game_code: gameCode,
        p_limit: limit
    });

    if (error) throw error;

    // Map RPC result to GameScore interface
    return data.map((item: any) => ({
        id: item.id,
        game_code: item.game_code,
        user_id: item.user_id,
        score: item.score,
        played_at: item.played_at,
        user: {
            full_name: item.full_name || 'Unknown',
            avatar_url: item.avatar_url
        }
    })) as GameScore[];
};

export const getAccumulatedLeaderboard = async (gameCode: string, limit = 10) => {
    const { data, error } = await supabase.rpc('get_accumulated_leaderboard', {
        p_game_code: gameCode,
        p_limit: limit
    });

    if (error) throw error;

    // Map to GameScore interface shape (mocking id/played_at for compatibility)
    return data.map((item: any) => ({
        id: 'acc-' + item.user_id,
        game_code: gameCode,
        user_id: item.user_id,
        score: item.total_score,
        played_at: new Date().toISOString(),
        user: {
            full_name: item.full_name,
            avatar_url: item.avatar_url
        }
    })) as GameScore[];
};

// --- Games ---

export const getGames = async () => {
    const { data, error } = await supabase
        .from('entertainment_games')
        .select('*')
        .order('name');
    if (error) throw error;
    return data;
};

// --- Games & Points ---


export const getGameConfig = async (code: string) => {
    const { data, error } = await supabase
        .from('entertainment_games')
        .select('config')
        .eq('code', code)
        .single();
    if (error) return null;
    return data.config;
};

export const updateGameConfig = async (code: string, config: any) => {
    const { error } = await supabase
        .from('entertainment_games')
        .update({ config })
        .eq('code', code);
    if (error) throw error;
};

export const getUserWallet = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

    // Lazy create wallet if not exists
    if (!data) {
        await supabase.from('user_wallets').insert({ user_id: userId, balance: 0 });
        return { balance: 0, total_earned: 0 };
    }
    return data;
};

export const addPoints = async (userId: string, amount: number, type: string, description: string, refId?: string) => {
    // Use RPC for secure transaction
    const { error } = await supabase.rpc('award_game_points', {
        p_user_id: userId,
        p_amount: amount,
        p_type: type,
        p_description: description,
        p_ref_id: refId
    });

    if (error) throw error;
};

export const redeemReward = async (itemId: string) => {
    // Call RPC function for atomic transaction
    const { data, error } = await supabase.rpc('redeem_reward', { p_item_id: itemId });
    if (error) throw error;
    return data;
};

export const getMyBestScore = async (gameCode: string, userId: string) => {
    const { data, error } = await supabase.rpc('get_my_best_score', {
        p_game_code: gameCode,
        p_user_id: userId
    });

    if (error) throw error;
    return data || 0;
};
