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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`
});

/**
 * Fetch the collective bonding fund data
 */
export const fetchBondingFund = async (token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/bonding_fund?select=*`, {
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(8000)
        });

        if (!res.ok) return { balance: 0, last_updated_at: new Date().toISOString() } as BondingFund;

        const data = await res.json();
        return (data && data.length > 0) ? data[0] as BondingFund : { balance: 0, last_updated_at: new Date().toISOString() } as BondingFund;
    } catch (error) {
        console.error("Error fetching bonding fund:", error);
        return { balance: 0, last_updated_at: new Date().toISOString() } as BondingFund;
    }
};

/**
 * Fetch all available achievement definitions
 */
export const fetchAchievements = async (token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/achievements?select=*`, {
            headers,
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return [] as Achievement[];
        return await res.json() as Achievement[];
    } catch (error) {
        console.error("Error fetching achievements:", error);
        return [] as Achievement[];
    }
};

/**
 * Fetch achievements earned by a specific user
 */
export const fetchUserAchievements = async (userId: string, token?: string) => {
    if (!userId) return [];
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/user_achievements?select=user_id,achievement_id,earned_at,achievement:achievements(*)&user_id=eq.${userId}`, {
            headers,
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return [];
        return await res.json() as any[];
    } catch (error) {
        console.error("Error fetching user achievements:", error);
        return [];
    }
};

/**
 * Fetch career level progression roadmap
 */
export const fetchCareerLevels = async (token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/career_levels?select=*&order=min_exp.asc`, {
            headers,
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return [] as CareerLevel[];
        return await res.json() as CareerLevel[];
    } catch (error) {
        console.error("Error fetching career levels:", error);
        return [] as CareerLevel[];
    }
};

/**
 * Calculate Leaderboard based on actual orders
 */
export const getLeaderboard = async (period: 'this_month' | 'this_week' = 'this_month', token?: string): Promise<LeaderboardEntry[]> => {
    const now = new Date();
    const startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'this_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startOfPeriod.setDate(diff);
    }

    try {
        const headers = getHeaders(token);
        const query = `created_at=gte.${startOfPeriod.toISOString()}&status=neq.cancelled&select=total_amount,telesales_user_id,profiles:profiles!orders_telesales_user_id_profiles_fkey(full_name,email)`;

        const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?${query}`, {
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(10000)
        });

        if (!res.ok) return [];

        const data = await res.json();
        const statsMap: Record<string, { name: string; orders: number; revenue: number }> = {};

        (data || []).forEach((order: any) => {
            const userId = order.telesales_user_id;
            if (!userId) return;
            const profile = order.profiles;
            const userName = profile?.full_name || profile?.email || "Nhân viên ẩn danh";

            if (!statsMap[userId]) {
                statsMap[userId] = { name: userName, orders: 0, revenue: 0 };
            }

            statsMap[userId].orders += 1;
            statsMap[userId].revenue += (Number(order.total_amount) || 0);
        });

        const result: LeaderboardEntry[] = Object.entries(statsMap).map(([userId, stats]) => ({
            user_id: userId,
            user_name: stats.name,
            total_orders: stats.orders,
            total_revenue: stats.revenue,
            rank: 0
        })).sort((a, b) => b.total_revenue - a.total_revenue);

        return result.map((entry, index) => ({ ...entry, rank: index + 1 }));
    } catch (error) {
        console.error("Error calculating leaderboard:", error);
        return [];
    }
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
