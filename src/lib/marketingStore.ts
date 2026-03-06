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
    scheduled_at?: string | null;
    campaign_id?: string | null;
    campaign?: MarketingCampaign;
    tracking_url?: string;
    // New Facebook Fields
    facebook_page_id?: string | null;
    facebook_page?: { name: string; avatar_url: string; }; // Joined
    media_urls?: string[];
    fb_post_id?: string;
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
            const txt = await res.text();
            // Handle RPC overload error gracefully or parse error
            console.error("fetchCampaignPerformance Error:", txt);
            return [];
        }

        const data = await res.json();
        return data as CampaignPerformance[];
    } catch (err) {
        console.error("fetchCampaignPerformance Exception:", err);
        return [];
    }
};

export interface MarketingLead {
    id: string;
    title: string;
    customer_name: string;
    phone: string;
    stage: string;
    created_at: string;
    owner_name?: string;
    expected_value?: number;
}

export const fetchCampaignLeads = async (token: string | undefined, campaignId: string): Promise<MarketingLead[]> => {
    try {
        const headers = getHeaders(token);
        // source_detail stores "campaign:UUID". We search for it.
        // We also join with crm_leads or deals. Assuming crm_deals based on previous context.
        // We select key fields + owner name if possible. Avoiding complex joins for now.
        // FIX: relation is 'customers', aliased as 'customer'
        const res = await fetch(`${SUPABASE_URL}/rest/v1/crm_deals?select=id,title,customer:customers(name,phone),stage,created_at,expected_value,owner:profiles(full_name)&source_detail=ilike.campaign:${campaignId}*&order=created_at.desc`, {
            headers
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        return data.map((d: any) => ({
            id: d.id,
            title: d.title,
            customer_name: d.customer?.name || 'Khách lẻ',
            phone: d.customer?.phone || '',
            stage: d.stage,
            created_at: d.created_at,
            owner_name: d.owner?.full_name,
            expected_value: d.expected_value
        }));
    } catch (err) {
        console.error("fetchCampaignLeads error:", err);
        return [];
    }
};

// ==========================================
// FACEBOOK INTEGRATION
// ==========================================

export interface FacebookPage {
    id: string; // our DB UUID
    page_id: string; // FB Page ID
    name: string;
    access_token?: string;
    category?: string;
    avatar_url?: string;
    is_connected: boolean;
    created_at: string;
    chatbot_config?: {
        greeting_text?: string;
        auto_hide_phone?: boolean;
        persistent_menu?: any[];
    };
}

export const fetchFacebookPages = async (token: string | undefined): Promise<FacebookPage[]> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/facebook_pages?select=*&is_connected=eq.true`, { headers });
        if (!res.ok) throw new Error(await res.text());
        return await res.json() as FacebookPage[];
    } catch (err) {
        console.error("fetchFacebookPages error:", err);
        return [];
    }
};

export const saveFacebookPage = async (page: Partial<FacebookPage>, token: string | undefined) => {
    try {
        const headers = getHeaders(token);
        // Upsert based on page_id to avoid duplicates if reconnecting
        const res = await fetch(`${SUPABASE_URL}/rest/v1/facebook_pages?on_conflict=page_id`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(page)
        });

        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (err) {
        console.error("saveFacebookPage error:", err);
        return null;
    }
};

// --- Real API Calls ---

export const exchangeFacebookToken = async (shortToken: string) => {
    try {
        const res = await fetch('/api/facebook/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ short_token: shortToken })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.pages; // List of pages with tokens
    } catch (err) {
        console.error("exchangeFacebookToken error:", err);
        throw err;
    }
};

export const publishToFacebook = async (pageToken: string, pageId: string, message: string, imageUrl?: string) => {
    try {
        const res = await fetch('/api/facebook/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page_token: pageToken,
                page_id: pageId,
                message,
                image_url: imageUrl
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data; // { id: "..." }
    } catch (err) {
        console.error("publishToFacebook error:", err);
        throw err;
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
        // Join with campaigns AND facebook_pages
        const params = new URLSearchParams({
            select: '*, campaign:marketing_campaigns(*), facebook_page:facebook_pages(name,avatar_url)',
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

// ==========================================
// SOCIAL CARE (INBOX)
// ==========================================

export interface SocialConversation {
    id: string;
    platform: 'facebook' | 'zalo' | 'tiktok';
    external_id: string;
    page_id?: string; // Add this
    customer_name: string;
    customer_avatar?: string;
    snippet?: string;
    unread_count: number;
    last_message_at: string;
    updated_at: string;
    tags?: string[];
    notes?: string;
    source_type?: 'ads' | 'post' | 'organic' | 'referral';
    source_detail?: any; // kept for legacy
    referral_source?: string; // New
    ad_id?: string;
    ad_title?: string;
    ref_parameter?: string;
    customer_profile_url?: string;
    customer_phone?: string;
    customer_region?: string;
    fb_thread_id?: string; // Facebook thread ID (t_XXX) for Business Suite linking
    page_name?: string; // Joined field
    page_avatar?: string; // Joined field
    post_id?: string;
    post_url?: string;
}

export interface SocialMessage {
    id: string;
    conversation_id: string;
    content: string;
    sender_id: string;
    sender_name?: string;
    is_from_page: boolean;
    created_at: string;
}

export const fetchConversations = async (token?: string, pageId?: string, filters?: { unread?: boolean, startDate?: Date, endDate?: Date }): Promise<SocialConversation[]> => {
    try {
        const headers = getHeaders(token);
        let url = `${SUPABASE_URL}/rest/v1/social_conversations?select=*&order=last_message_at.desc`;
        if (pageId) {
            url += `&page_id=eq.${pageId}`;
        }
        if (filters?.unread) {
            url += `&unread_count=gt.0`;
        }
        if (filters?.startDate) {
            url += `&last_message_at=gte.${filters.startDate.toISOString()}`;
        }
        if (filters?.endDate) {
            // endDate should be end of day essentially, or next day
            url += `&last_message_at=lte.${filters.endDate.toISOString()}`;
        }
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (err) {
        console.error("fetchConversations error:", err);
        return [];
    }
};

export const fetchInboxCounts = async (token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_inbox_counts`, {
            method: 'POST',
            headers
        });
        if (!res.ok) throw new Error(await res.text());
        return await res.json() as { page_id: string, page_name: string, unread_conversations: number, total_conversations: number }[];
    } catch (err) {
        console.error("fetchInboxCounts error:", err);
        return [];
    }
};

export const updateConversationMetadata = async (id: string, updates: { tags?: string[], notes?: string, customer_phone?: string, customer_region?: string }, token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/social_conversations?id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updates)
        });
        return res.ok;
    } catch (err) {
        console.error("updateConversationMetadata error:", err);
        return false;
    }
};

export const fetchMessages = async (conversationId: string, token?: string): Promise<SocialMessage[]> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/social_messages?conversation_id=eq.${conversationId}&order=created_at.asc`, { headers });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (err) {
        console.error("fetchMessages error:", err);
        return [];
    }
};

export const sendSocialReply = async (recipientId: string, message: string, pageToken: string, conversationId?: string) => {
    try {
        const res = await fetch('/api/facebook/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_id: recipientId,
                message,
                page_token: pageToken,
                conversation_id: conversationId
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (err) {
        console.error("sendSocialReply error:", err);
        throw err;
    }
};

// ==========================================
// CHATBOT AUTOMATION
// ==========================================

export interface ChatbotRule {
    id: string;
    page_id?: string | null;
    keyword: string;
    match_type: 'exact' | 'contains';
    response_text: string;
    response_type: 'text' | 'image' | 'gallery';
    media_url?: string;
    buttons?: any[];
    is_active: boolean;
    created_at: string;
}

export const fetchChatbotRules = async (token?: string, pageId?: string): Promise<ChatbotRule[]> => {
    try {
        const headers = getHeaders(token);
        let url = `${SUPABASE_URL}/rest/v1/chatbot_rules?select=*&order=created_at.desc`;
        if (pageId) {
            url += `&page_id=eq.${pageId}`;
        }
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (err) {
        console.error("fetchChatbotRules error:", err);
        return [];
    }
};

export const createChatbotRule = async (rule: Partial<ChatbotRule>, token?: string): Promise<ChatbotRule | null> => {
    try {
        const headers = getHeaders(token);
        headers['Prefer'] = 'return=representation'; // Get back the created object
        const res = await fetch(`${SUPABASE_URL}/rest/v1/chatbot_rules`, {
            method: 'POST',
            headers,
            body: JSON.stringify(rule)
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data?.[0] || null;
    } catch (err) {
        console.error("createChatbotRule error:", err);
        return null;
    }
};

export const updateChatbotRule = async (id: string, updates: Partial<ChatbotRule>, token?: string): Promise<boolean> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/chatbot_rules?id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updates)
        });
        return res.ok;
    } catch (err) {
        console.error("updateChatbotRule error:", err);
        return false;
    }
};

export const deleteChatbotRule = async (id: string, token?: string): Promise<boolean> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/chatbot_rules?id=eq.${id}`, {
            method: 'DELETE',
            headers
        });
        return res.ok;
    } catch (err) {
        console.error("deleteChatbotRule error:", err);
        return false;
    }
};

// --- Profile Config ---
export const updateMessengerProfile = async (pageId: string, pageToken: string, config: any) => {
    try {
        const res = await fetch('/api/facebook/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page_id: pageId,
                page_token: pageToken,
                ...config
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return true;
    } catch (err) {
        console.error("updateMessengerProfile error:", err);
        throw err;
    }
};
