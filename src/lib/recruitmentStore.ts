import { createClient } from './supabaseClient';

// Types
export type JobStatus = 'draft' | 'open' | 'closed';
export type CandidateStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';
export type InterviewType = 'online' | 'offline' | 'phone';

export interface RecruitmentJob {
    id: string;
    title: string;
    department: string;
    location: string;
    salary_range: string;
    description: string;
    requirements: string;
    status: JobStatus;
    created_at: string;
    created_by?: string;
}

export interface RecruitmentCandidate {
    id: string;
    job_id: string;
    full_name: string;
    email: string;
    phone: string;
    status: CandidateStatus;
    created_at: string;
    source?: string;
    tracking_code?: string;
    cv_url?: string;
    notes?: string;
    // New detailed fields
    experience_years?: string;
    expected_salary?: string;
    current_company?: string;
    skills?: string;
    availability_date?: string;
    rating?: number;
    // Personal Info
    education?: string;
    hometown?: string;
    address?: string;
    id_card_front?: string;
    id_card_back?: string;
    job?: {
        title: string;
    };
}

export interface RecruitmentInterview {
    id: string;
    candidate_id: string;
    interviewer_id: string;
    scheduled_at: string;
    type: InterviewType;
    status: InterviewStatus;
    meeting_link: string;
    location?: string;
    feedback: string;
    candidate?: {
        full_name: string;
    };
    interviewer?: {
        full_name: string;
    };
}

const supabase = createClient();

// JOBS
export const getJobs = async () => {
    const { data, error } = await supabase
        .from('recruitment_jobs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RecruitmentJob[];
};

export const getJob = async (id: string) => {
    const { data, error } = await supabase
        .from('recruitment_jobs')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as RecruitmentJob;
};

export const createJob = async (job: Partial<RecruitmentJob>) => {
    const { data, error } = await supabase
        .from('recruitment_jobs')
        .insert([{ ...job, status: job.status || 'draft' }])
        .select()
        .single();

    if (error) throw error;
    return data as RecruitmentJob;
};

export const updateJob = async (id: string, updates: Partial<RecruitmentJob>) => {
    const { data, error } = await supabase
        .from('recruitment_jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as RecruitmentJob;
};

export const deleteJob = async (id: string) => {
    const { error } = await supabase
        .from('recruitment_jobs')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// CANDIDATES
export const getCandidates = async (jobId?: string) => {
    let query = supabase
        .from('recruitment_candidates')
        .select('*, job:recruitment_jobs(title)')
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
    if (error) throw error;
    return data as RecruitmentCandidate;
};

export const updateCandidate = async (id: string, updates: Partial<RecruitmentCandidate>) => {
    // Remove nested relations that shouldn't be sent to update
    const { job, ...validUpdates } = updates;

    const { data, error } = await supabase
        .from('recruitment_candidates')
        .update(validUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as RecruitmentCandidate;
};

export const updateCandidateStatus = async (id: string, status: CandidateStatus) => {
    const { data, error } = await supabase
        .from('recruitment_candidates')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as RecruitmentCandidate;
};

export const deleteCandidate = async (id: string) => {
    const { error } = await supabase
        .from('recruitment_candidates')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// INTERVIEWS
export const getInterviews = async () => {
    const { data, error } = await supabase
        .from('recruitment_interviews')
        // Explicitly specifying the foreign key constraint to resolve ambiguity
        // Constraint name is typically: table_column_fkey
        .select('*, candidate:recruitment_candidates(full_name), interviewer:profiles!recruitment_interviews_interviewer_id_fkey(full_name)')
        .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data as unknown as RecruitmentInterview[]; // Casting due to join complexity
};

export const getInterviewsByCandidate = async (candidateId: string) => {
    const { data, error } = await supabase
        .from('recruitment_interviews')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data as RecruitmentInterview[];
};

export const scheduleInterview = async (interview: Partial<RecruitmentInterview>) => {
    const { data, error } = await supabase
        .from('recruitment_interviews')
        .insert([interview])
        .select()
        .single();
    if (error) throw error;
    return data as RecruitmentInterview;
};

export const updateInterview = async (id: string, updates: Partial<RecruitmentInterview>) => {
    const { data, error } = await supabase
        .from('recruitment_interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as RecruitmentInterview;
};

export const deleteInterview = async (id: string) => {
    const { error } = await supabase
        .from('recruitment_interviews')
        .delete()
        .eq('id', id);
    if (error) throw error;
};
