import { createClient } from "@/lib/supabaseClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY || ''
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
    }
    return headers;
};

export type CampaignStatus = 'planning' | 'active' | 'completed' | 'paused';
export type PostStatus = 'draft' | 'scheduled' | 'published';
export type Platform = 'facebook' | 'tiktok' | 'website' | 'zalo' | 'other';

export interface MarketingCampaign {
    id: string;
    created_at: string;
    title: string;
    description?: string;
    status: CampaignStatus;
    start_date?: string;
    end_date?: string;
    budget: number;
    channel?: string;
}

export interface MarketingPost {
    id: string;
    created_at: string;
    title: string;
    content?: string;
    platform: Platform;
    status: PostStatus;
    scheduled_at?: string;
    campaign_id?: string;
    campaign?: MarketingCampaign;
    tracking_url?: string;
}

export interface MarketingStats {
    active_campaigns: number;
    scheduled_posts: number;
    total_posts: number;
    budget_active: number;
}

// --- Campaigns ---
export const fetchCampaigns = async (token?: string): Promise<MarketingCampaign[]> => {
    try {
        const headers = getHeaders(token);
        const params = new URLSearchParams({
            select: '*',
            order: 'created_at.desc'
        });
        const res = await fetch(`${SUPABASE_URL}/rest/v1/marketing_campaigns?${params.toString()}`, {
            headers
        });

        if (!res.ok) {
            console.error("Error loading campaigns:", await res.text());
            return [];
        }

        const data = await res.json();
        return data || [];
    } catch (err) {
        console.error("fetchCampaigns Exception:", err);
        return [];
    }
};

export const fetchMarketingStats = async (token?: string): Promise<MarketingStats> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_marketing_dashboard_stats`, {
            method: 'POST',
            headers
        });

        if (!res.ok) {
            console.error("Error fetching stats:", await res.text());
            return {
                active_campaigns: 0,
                scheduled_posts: 0,
                total_posts: 0,
                budget_active: 0
            };
        }

        return await res.json();
    } catch (err) {
        console.error("fetchMarketingStats Exception:", err);
        return {
            active_campaigns: 0,
            scheduled_posts: 0,
            total_posts: 0,
            budget_active: 0
        };
    }
};



export interface CampaignPerformance {
    campaign_id: string;
    title: string;
    status: CampaignStatus;
    lead_count: number;
    revenue: number;
}

export const fetchCampaignPerformance = async (token?: string, startDate?: Date | null, endDate?: Date | null): Promise<CampaignPerformance[]> => {
    try {
        const headers = getHeaders(token);
        const body: any = {};
        if (startDate) body.start_date = startDate.toISOString();
        if (endDate) body.end_date = endDate.toISOString();

        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_campaign_performance_stats`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            console.error("Error fetching campaign performance:", await res.text());
            return [];
        }

        return await res.json();
    } catch (err) {
        console.error("fetchCampaignPerformance Exception:", err);
        return [];
    }
};

export const createCampaign = async (campaign: Partial<MarketingCampaign>, token?: string): Promise<MarketingCampaign | null> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/marketing_campaigns`, {
            method: 'POST',
            headers,
            body: JSON.stringify(campaign)
        });

        if (!res.ok) {
            console.error("Error creating campaign:", await res.text());
            return null;
        }

        const data = await res.json();
        return data?.[0] || null;
    } catch (err) {
        console.error("createCampaign Exception:", err);
        return null;
    }
    return null; // Should not reach here
};

export const updateCampaign = async (id: string, updates: Partial<MarketingCampaign>, token?: string): Promise<boolean> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/marketing_campaigns?id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updates)
        });
        return res.ok;
    } catch (err) {
        console.error("updateCampaign Exception:", err);
        return false;
    }
};
// Note: REST POST in Supabase returns 201 Created but doesn't return body by default unless Prefer: return=representation is set.
// Standard fetch helper should handle this or we just assume success.
// Better to use query param? or header 'Prefer': 'return=representation'

export const deleteCampaign = async (id: string, token?: string): Promise<boolean> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/marketing_campaigns?id=eq.${id}`, {
            method: 'DELETE',
            headers
        });
        return res.ok;
    } catch (err) {
        console.error("deleteCampaign Exception:", err);
        return false;
    }
};

// --- Posts ---
export const fetchMarketingPosts = async (token?: string): Promise<MarketingPost[]> => {
    try {
        const headers = getHeaders(token);
        // Join with campaigns to get campaign title if needed
        const params = new URLSearchParams({
            select: '*, campaign:marketing_campaigns(*)',
            order: 'scheduled_at.asc'
        });
        const res = await fetch(`${SUPABASE_URL}/rest/v1/marketing_posts?${params.toString()}`, {
            headers
        });

        if (!res.ok) {
            console.error("Error loading posts:", await res.text());
            return [];
        }

        const data = await res.json();
        return data || [];
    } catch (err) {
        console.error("fetchMarketingPosts Exception:", err);
        return [];
    }
};

export const createMarketingPost = async (post: Partial<MarketingPost>, token?: string): Promise<MarketingPost | null> => {
    try {
        const headers = getHeaders(token);
        // Ensure Prefer header for return
        headers['Prefer'] = 'return=representation';

        const res = await fetch(`${SUPABASE_URL}/rest/v1/marketing_posts`, {
            method: 'POST',
            headers,
            body: JSON.stringify(post)
        });

        if (!res.ok) {
            console.error("Error creating post:", await res.text());
            return null;
        }

        const data = await res.json();
        return data?.[0] || null;
    } catch (err) {
        console.error("createMarketingPost Exception:", err);
        return null;
    }
};

export const updateMarketingPost = async (id: string, updates: Partial<MarketingPost>, token?: string): Promise<boolean> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/marketing_posts?id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updates)
        });
        return res.ok;
    } catch (err) {
        console.error("updateMarketingPost Exception:", err);
        return false;
    }
}

export const deleteMarketingPost = async (id: string, token?: string): Promise<boolean> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/marketing_posts?id=eq.${id}`, {
            method: 'DELETE',
            headers
        });
        return res.ok;
    } catch (err) {
        console.error("deleteMarketingPost Exception:", err);
        return false;
    }
};
