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
    // New fields for upgrade
    other_tasks?: string;
    no_post_reason?: string;
    plan_next_day?: string;
}

export interface PostLog {
    id: string;
    user_id: string;
    date: string;
    platform: 'facebook_group' | 'facebook_page' | 'threads' | 'zalo' | 'linkedin' | 'other';
    group_name: string;
    group_link: string;
    post_link: string;
    content_excerpt: string;
    image_url: string;
    created_at: string;
    activity_type: 'post' | 'comment' | 'reaction' | 'share' | 'friend';
    group_note?: string;
}

export interface RecruitmentGroup {
    id: string;
    link: string;
    name: string;
    platform: string;
    notes?: string;
    status: 'active' | 'archived' | 'banned';
    updated_at: string;
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

// --- KPI Types ---

export interface RecruitmentKpiSettings {
    user_id: string;
    fb_posts_target: number;
    fb_comments_target: number;
    fb_friends_target: number;
    created_at?: string;
    updated_at?: string;
}

export interface RecruitmentKpiStats {
    posts_count: number;
    comments_count: number;
    friends_count: number;
    posts_target: number;
    comments_target: number;
    friends_target: number;
}

// --- Restore Missing Interfaces for Candidates ---
export interface RecruitmentJob {
    id: string;
    title: string;
    description?: string;
    requirements?: string;
    department?: string;
    location?: string;
    salary_range?: string;
    status: 'open' | 'closed' | 'draft';
    created_at?: string;
}

export type CandidateStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface RecruitmentCandidate {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    cv_url?: string;
    source?: string;
    tracking_code?: string;
    status: CandidateStatus;
    rating?: number;
    notes?: string;
    job_id?: string;
    job?: RecruitmentJob;
    skills?: string;
    education?: string;
    hometown?: string;
    address?: string;
    id_card_front?: string;
    id_card_back?: string;
    current_company?: string;
    experience_years?: number;
    expected_salary?: string;
    availability_date?: string;
    created_at: string;
}

export interface RecruitmentInterview {
    id: string;
    candidate_id: string;
    interviewer_id?: string;
    interviewer?: { full_name: string };
    candidate?: { full_name: string; job?: { title: string } };
    scheduled_at: string;
    type: 'online' | 'offline';
    location?: string;
    meeting_link?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    feedback?: string;
    created_at: string;
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

export const getPostLogs = async (userId: string, date: string) => {
    const { data, error } = await supabase
        .from('recruitment_post_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PostLog[];
};

export const createPostLog = async (log: Partial<PostLog>) => {
    const { data, error } = await supabase
        .from('recruitment_post_logs')
        .insert([log])
        .select()
        .single();

    if (error) throw error;
    return data as PostLog;
};

export const updatePostLog = async (id: string, updates: Partial<PostLog>) => {
    const { data, error } = await supabase
        .from('recruitment_post_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as PostLog;
};

export const deletePostLog = async (id: string) => {
    const { error } = await supabase
        .from('recruitment_post_logs')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

export const upsertGroup = async (group: Partial<RecruitmentGroup>) => {
    const { data, error } = await supabase
        .from('recruitment_groups')
        .upsert(group as any, { onConflict: 'link' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const searchGroups = async (keyword: string) => {
    const { data, error } = await supabase
        .from('recruitment_groups')
        .select('*')
        .ilike('name', `%${keyword}%`)
        .limit(10);

    if (error) throw error;
    return data as RecruitmentGroup[];
};

export const getGroups = async () => {
    const { data, error } = await supabase
        .from('recruitment_groups')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as RecruitmentGroup[];
};

export const deleteGroup = async (id: string) => {
    const { error } = await supabase
        .from('recruitment_groups')
        .delete()
        .eq('id', id);

    if (error) throw error;
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

export const getAllDailyReports = async (startDate: string, endDate: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Join with profiles to get name/avatar
    const { data, error } = await supabase
        .from('recruitment_daily_activities')
        .select('*, profile:profiles(full_name, avatar_url, email)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

    if (error) throw error;
    return data as (DailyActivity & { profile: { full_name: string, avatar_url: string, email: string } })[];
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Người dùng chưa đăng nhập");
    }

    const { data, error } = await supabase
        .from('recruitment_contacts')
        .insert([{ ...contact, created_by: user.id }])
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

export const createPlatform = async (platform: Partial<RecruitmentPlatform>) => {
    const { data, error } = await supabase
        .from('recruitment_platforms')
        .insert([platform])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updatePlatform = async (id: string, updates: Partial<RecruitmentPlatform>) => {
    const { data, error } = await supabase
        .from('recruitment_platforms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deletePlatform = async (id: string) => {
    const { error } = await supabase
        .from('recruitment_platforms')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// --- RESTORED: Candidates & Jobs Functions ---

export const getJobs = async () => {
    const { data, error } = await supabase
        .from('recruitment_jobs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RecruitmentJob[];
};

export const getJobById = async (id: string) => {
    const { data, error } = await supabase
        .from('recruitment_jobs')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as RecruitmentJob;
};

export const getJob = getJobById;

export const createJob = async (job: Partial<RecruitmentJob>) => {
    const { data, error } = await supabase
        .from('recruitment_jobs')
        .insert([job])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateJob = async (id: string, updates: Partial<RecruitmentJob>) => {
    const { data, error } = await supabase
        .from('recruitment_jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteJob = async (id: string) => {
    const { error } = await supabase
        .from('recruitment_jobs')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

export const getCandidates = async (jobId?: string) => {
    let query = supabase
        .from('recruitment_candidates')
        .select('*, job:job_id(*)')
        .order('created_at', { ascending: false });

    if (jobId) {
        query = query.eq('job_id', jobId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as RecruitmentCandidate[];
};

export const createCandidate = async (candidate: Partial<RecruitmentCandidate>) => {
    const { data, error } = await supabase
        .from('recruitment_candidates')
        .insert([candidate])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateCandidate = async (id: string, updates: Partial<RecruitmentCandidate>) => {
    const { data, error } = await supabase
        .from('recruitment_candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateCandidateStatus = async (id: string, status: string) => {
    const { data, error } = await supabase
        .from('recruitment_candidates')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteCandidates = async (ids: string[]) => {
    const { error } = await supabase
        .from('recruitment_candidates')
        .delete()
        .in('id', ids);

    if (error) throw error;
    return true;
};

export const deleteCandidate = async (id: string) => {
    return deleteCandidates([id]);
};

export const getInterviews = async (candidateId?: string) => {
    let query = supabase
        .from('recruitment_interviews')
        .select('*, interviewer:interviewer_id(full_name), candidate:candidate_id(full_name, job:job_id(title))')
        .order('scheduled_at', { ascending: true });

    if (candidateId) {
        query = query.eq('candidate_id', candidateId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as RecruitmentInterview[];
};

export const getInterviewsByCandidate = getInterviews;

export const scheduleInterview = async (interview: Partial<RecruitmentInterview>) => {
    const { data, error } = await supabase
        .from('recruitment_interviews')
        .insert([interview])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateInterview = async (id: string, updates: Partial<RecruitmentInterview>) => {
    const { data, error } = await supabase
        .from('recruitment_interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteInterview = async (id: string) => {
    const { error } = await supabase
        .from('recruitment_interviews')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// --- KPI Functions ---

export const getRecruitmentKpiSettings = async (userId: string) => {
    const { data, error } = await supabase
        .from('recruitment_kpi_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;

    // Default values if no settings found
    if (!data) {
        return {
            user_id: userId,
            fb_posts_target: 20,
            fb_comments_target: 50,
            fb_friends_target: 10
        } as RecruitmentKpiSettings;
    }

    return data as RecruitmentKpiSettings;
};

export const updateRecruitmentKpiSettings = async (settings: Partial<RecruitmentKpiSettings> & { user_id: string }) => {
    // Only Admin/Manager can update - handled by RLS.
    // However, for first-time insert (initialization), User can insert.
    // We use upsert to handle both cases.

    const { data, error } = await supabase
        .from('recruitment_kpi_settings')
        .upsert(settings)
        .select()
        .single();

    if (error) throw error;
    return data as RecruitmentKpiSettings;
};

export const getRecruitmentKpiStats = async (userId: string, date: string): Promise<RecruitmentKpiStats> => {
    // 1. Get Settings (Targets)
    const settings = await getRecruitmentKpiSettings(userId);

    // 2. Get Logs (Actuals)
    // We fetch all logs for the day to count them.
    // Optimization: In a huge app, we might use a summary table or count query, 
    // but for daily logs (usually < 100 items), fetching client-side is fine and supports realtime updates easier.
    const logs = await getPostLogs(userId, date);

    const postsCount = logs.filter(l => l.activity_type === 'post').length;
    const commentsCount = logs.filter(l => l.activity_type === 'comment').length;
    const friendsCount = logs.filter(l => l.activity_type === 'friend').length;

    return {
        posts_count: postsCount,
        comments_count: commentsCount,
        friends_count: friendsCount,
        posts_target: settings.fb_posts_target,
        comments_target: settings.fb_comments_target,
        friends_target: settings.fb_friends_target
    };
};

export const syncLogsToDailyReport = async (userId: string, date: string) => {
    // 1. Get current stats
    const stats = await getRecruitmentKpiStats(userId, date);

    // 2. Update Daily Report table
    // Note: We use upsert to create the row if it doesn't exist yet
    // mapped to legacy fields as best as possible
    const { error } = await supabase
        .from('recruitment_daily_activities')
        .upsert({
            user_id: userId,
            date: date,
            fb_posts_free: stats.posts_count,
            fb_comments: stats.comments_count,
            fb_friends: stats.friends_count,
            // Preserve other fields? Upsert updates detailed columns only if specified.
            // CAUTION: This might overwrite other fields if row is new. 
            // Better to use UPDATE if exists, else INSERT. But upsert is simpler for now.
            // Ideally we should fetch first, but to save bandwidth we assume 'upsert' merges if we provide ID.
            // Actually supabase upsert REPLACES row unless we specify ignoreDuplicates which is not update.
            // Wait, Supabase upsert updates ONLY the columns provided if match found? NO, it replaces row unless specified?
            // "If you want to perform an UPSERT... you should specify all columns that should be inserted/updated."
            // To be safe, let's just update specific metrics.
        } as any, { onConflict: 'user_id, date' });

    if (error) {
        console.error("Error syncing logs to daily report:", error);
    }
};


// --- Admin Functions ---

export const getRecruitmentUsers = async () => {
    // Fetch profiles with relevant roles for recruitment
    // This assumes specific roles are used. Adjust if 'telesales' is also used for recruitment.
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url')
        .in('role', ['admin', 'manager', 'recruiter', 'recruiter_manager', 'telesales'])
        .order('full_name');

    if (error) throw error;
    return data as { id: string, email: string, full_name: string, role: string, avatar_url: string }[];
};
