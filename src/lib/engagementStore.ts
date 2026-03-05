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
    avatar_url?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`
});

const getSignal = (timeout: number) => {
    try {
        if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
            return (AbortSignal as any).timeout(timeout);
        }
    } catch (e) {
        // Fallback below
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
};

/**
 * Fetch the collective bonding fund data
 */
export const fetchBondingFund = async (token?: string) => {
    try {
        const headers = getHeaders(token);
        const params = new URLSearchParams({ select: '*' });
        const res = await fetch(`${SUPABASE_URL}/rest/v1/bonding_fund?${params.toString()}`, {
            headers,
            cache: 'no-store',
            signal: getSignal(8000)
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
        const params = new URLSearchParams({ select: '*' });
        const res = await fetch(`${SUPABASE_URL}/rest/v1/achievements?${params.toString()}`, {
            headers,
            signal: getSignal(8000)
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
        const params = new URLSearchParams({
            select: 'user_id,achievement_id,earned_at,achievement:achievements(*)',
            user_id: `eq.${userId}`
        });
        const res = await fetch(`${SUPABASE_URL}/rest/v1/user_achievements?${params.toString()}`, {
            headers,
            signal: getSignal(8000)
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
        const params = new URLSearchParams({
            select: '*',
            order: 'min_exp.asc'
        });
        const res = await fetch(`${SUPABASE_URL}/rest/v1/career_levels?${params.toString()}`, {
            headers,
            signal: getSignal(8000)
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
/**
 * Calculate Leaderboard based on CRM Deals Revenue (Realtime RPC)
 */
/**
 * Calculate Leaderboard based on Delivered Orders Revenue (Realtime RPC V2)
 */
export const getLeaderboard = async (startDate: Date, endDate: Date, token?: string): Promise<LeaderboardEntry[]> => {
    try {
        const headers = getHeaders(token);

        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_realtime_leaderboard_v2`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString()
            }),
            cache: 'no-store',
            signal: getSignal(10000)
        });

        if (!res.ok) {
            console.error("Leaderboard RPC error:", await res.text());
            return [];
        }

        const data = await res.json();

        // Map RPC result to LeaderboardEntry interface
        return data.map((item: any) => ({
            user_id: item.user_id,
            user_name: item.full_name || 'Unknown',
            avatar_url: item.avatar_url,
            total_orders: item.total_orders,
            total_revenue: item.total_revenue,
            rank: item.rank
        }));

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
};

/**
 * Real-time subscription for Bonding Fund
 * NOTE: Disabled to save Supabase egress. Bonding fund rarely changes.
 */
export const subscribeToBondingFund = (_callback: (fund: BondingFund) => void) => {
    return null;
};

/**
 * Real-time subscription for User Achievements
 * NOTE: Disabled to save Supabase egress. Achievements rarely change.
 */
export const subscribeToUserAchievements = (_userId: string, _callback: () => void) => {
    return null;
};
