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
