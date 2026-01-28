import { supabase } from "@/lib/supabaseClient";

export interface DailyActivity {
    id: string;
    user_id: string;
    date: string;
    fb_posts_paid: number;
    fb_posts_free: number;
    fb_comments: number;
    fb_friends: number;
    threads_posts: number;
    threads_comments: number;
    issues: string;
    request_support: string;
    created_at?: string;
}

export interface RecruitmentContact {
    id: string;
    name: string;
    position: string;
    organization: string;
    phone: string;
    email: string;
    social_link: string;
    notes: string;
    status: 'new' | 'contacted' | 'connected';
    created_by?: string;
    created_at?: string;
}

export interface RecruitmentPlatform {
    id: string;
    name: string;
    type: string;
    pricing_details: string;
    tips: string;
    active: boolean;
}

// --- Daily Activities ---

export const getDailyReport = async (date: string, userId: string) => {
    const { data, error } = await supabase
        .from('recruitment_daily_activities')
        .select('*')
        .eq('date', date)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data as DailyActivity | null;
};

export const upsertDailyReport = async (report: Partial<DailyActivity>) => {
    // Only allow specific fields to be updated
    const { id, created_at, ...updateData } = report;

    const { data, error } = await supabase
        .from('recruitment_daily_activities')
        .upsert(updateData as any, { onConflict: 'user_id, date' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getMyReportsHistory = async (userId: string, limit = 7) => {
    const { data, error } = await supabase
        .from('recruitment_daily_activities')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as DailyActivity[];
};

// --- Networking / Contacts ---

export const getContacts = async () => {
    const { data, error } = await supabase
        .from('recruitment_contacts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RecruitmentContact[];
};

export const createContact = async (contact: Partial<RecruitmentContact>) => {
    const { data, error } = await supabase
        .from('recruitment_contacts')
        .insert([contact])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateContact = async (id: string, updates: Partial<RecruitmentContact>) => {
    const { data, error } = await supabase
        .from('recruitment_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteContact = async (id: string) => {
    const { error } = await supabase
        .from('recruitment_contacts')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// --- Platforms ---

export const getPlatforms = async () => {
    const { data, error } = await supabase
        .from('recruitment_platforms')
        .select('*')
        .order('name');

    if (error) throw error;
    return data as RecruitmentPlatform[];
};
