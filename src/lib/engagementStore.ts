import { supabase } from "./supabaseClient";

export interface BondingFund {
    id: string;
    balance: number;
    last_updated_at: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon_name: string;
    color_class: string;
}

export interface UserAchievement {
    user_id: string;
    achievement_id: string;
    earned_at: string;
    achievement: Achievement;
}

export interface CareerLevel {
    id: number;
    name: string;
    min_exp: number;
    icon_name: string;
}

export interface LeaderboardEntry {
    user_id: string;
    user_name: string;
    total_orders: number;
    total_revenue: number;
    rank: number;
}

/**
 * Fetch the collective bonding fund data
 */
export const fetchBondingFund = async () => {
    const { data, error } = await supabase
        .from('bonding_fund')
        .select('*')
        .single();
    if (error) {
        console.error("Error fetching bonding fund:", error);
        return { balance: 0, last_updated_at: new Date().toISOString() } as BondingFund;
    }
    return data as BondingFund;
};

/**
 * Fetch all available achievement definitions
 */
export const fetchAchievements = async () => {
    const { data, error } = await supabase
        .from('achievements')
        .select('*');
    if (error) throw error;
    return data as Achievement[];
};

/**
 * Fetch achievements earned by a specific user
 */
export const fetchUserAchievements = async (userId: string) => {
    if (!userId) return [];
    const { data, error } = await supabase
        .from('user_achievements')
        .select('user_id, achievement_id, earned_at, achievement:achievements(*)')
        .eq('user_id', userId);
    if (error) throw error;
    return data as any[];
};

/**
 * Fetch career level progression roadmap
 */
export const fetchCareerLevels = async () => {
    const { data, error } = await supabase
        .from('career_levels')
        .select('*')
        .order('min_exp', { ascending: true });
    if (error) throw error;
    return data as CareerLevel[];
};

/**
 * Calculate Leaderboard based on actual orders
 */
export const getLeaderboard = async (period: 'this_month' | 'this_week' = 'this_month'): Promise<LeaderboardEntry[]> => {
    const now = new Date();
    const startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'this_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startOfPeriod.setDate(diff);
    }

    // Fixed query: Use telesales_user_id and profiles!orders_telesales_user_id_profiles_fkey(full_name, email)
    const { data, error } = await supabase
        .from('orders')
        .select('total_amount, telesales_user_id, profiles!orders_telesales_user_id_profiles_fkey(full_name, email)')
        .gte('created_at', startOfPeriod.toISOString())
        .not('status', 'eq', 'cancelled');

    if (error) {
        console.error("Error calculating leaderboard:", error);
        return [];
    }

    // Aggregate by user
    const statsMap: Record<string, { name: string; orders: number; revenue: number }> = {};

    data.forEach((order: any) => {
        const userId = order.telesales_user_id;
        const profile = order.profiles;
        const userName = profile?.full_name || profile?.email || "Nhân viên ẩn danh";

        if (!statsMap[userId]) {
            statsMap[userId] = { name: userName, orders: 0, revenue: 0 };
        }

        statsMap[userId].orders += 1;
        statsMap[userId].revenue += (Number(order.total_amount) || 0);
    });

    // Convert to array and sort
    const result: LeaderboardEntry[] = Object.entries(statsMap).map(([userId, stats]) => ({
        user_id: userId,
        user_name: stats.name,
        total_orders: stats.orders,
        total_revenue: stats.revenue,
        rank: 0
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    // Assign ranks
    return result.map((entry, index) => ({ ...entry, rank: index + 1 }));
};

/**
 * Real-time subscription for Bonding Fund
 */
export const subscribeToBondingFund = (callback: (fund: BondingFund) => void) => {
    return supabase
        .channel('bonding_fund_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bonding_fund' }, (payload: any) => {
            if (payload.new) {
                callback(payload.new as BondingFund);
            }
        })
        .subscribe();
};

/**
 * Real-time subscription for User Achievements
 */
export const subscribeToUserAchievements = (userId: string, callback: () => void) => {
    if (!userId) return null;
    return supabase
        .channel(`user_achievements_${userId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'user_achievements',
            filter: `user_id=eq.${userId}`
        }, () => {
            callback();
        })
        .subscribe();
};
