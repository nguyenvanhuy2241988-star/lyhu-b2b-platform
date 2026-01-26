
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
    // 1. Transaction
    const { error: txError } = await supabase.from('point_transactions').insert({
        user_id: userId,
        amount,
        type,
        description,
        reference_id: refId
    });
    if (txError) throw txError;

    // 2. Update Wallet (Simple Increment)
    // For safer concurrency, use RPC, but simple update is ok for low volume
    const { data: wallet } = await supabase.from('user_wallets').select('balance, total_earned').eq('user_id', userId).single();
    const currentBal = wallet?.balance || 0;
    const currentTotal = wallet?.total_earned || 0;

    const { error: walletError } = await supabase.from('user_wallets').update({
        balance: currentBal + amount,
        total_earned: amount > 0 ? currentTotal + amount : currentTotal,
        last_updated: new Date().toISOString()
    }).eq('user_id', userId);

    if (walletError) throw walletError;
};

export const redeemReward = async (itemId: string) => {
    // Call RPC function for atomic transaction
    const { data, error } = await supabase.rpc('redeem_reward', { p_item_id: itemId });
    if (error) throw error;
    return data;
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
