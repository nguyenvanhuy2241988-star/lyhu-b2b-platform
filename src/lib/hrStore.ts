import { createClient } from './supabaseClient';

export interface Department {
    id: string;
    name: string;
    description?: string;
    manager_id?: string;
    created_at: string;
    manager?: {
        full_name: string;
    };
    member_count?: number;
}

export interface HRProfile {
    id: string;
    email?: string;
    full_name: string;
    avatar_url?: string;
    role: string;
    // HR Fields
    department_id?: string;
    department?: {
        name: string;
    };
    employee_code?: string;
    dob?: string;
    start_date?: string;
    position?: string;
    work_type?: 'fulltime' | 'parttime' | 'intern';
    phone?: string;
    // Extended Fields
    place_of_origin?: string;
    identity_card?: string;
    education_school?: string;
    education_major?: string;
    interests?: string;
    social_facebook?: string;
}

const supabase = createClient();

// DEPARTMENTS
export const getDepartments = async () => {
    const { data, error } = await supabase
        .from('departments')
        .select(`
            *,
            manager:profiles!departments_manager_id_fkey(full_name)
        `)
        .order('name');

    if (error) throw error;
    return data as Department[];
};

// PROFILES (HR VIEW)
export const getHRProfiles = async (departmentId?: string, includeInactive: boolean = false) => {
    let query = supabase
        .from('profiles')
        .select(`
            *,
            department:departments!profiles_department_id_fkey(name)
        `)
        .order('full_name');

    if (!includeInactive) {
        query = query.neq('status', 'inactive');
    }

    if (departmentId) {
        query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as HRProfile[];
};

export const hideHRProfile = async (id: string) => {
    const { error } = await supabase.rpc('hide_hr_profile_rpc', { p_user_id: id });
    if (error) throw error;
};

export const unhideHRProfile = async (id: string) => {
    const { error } = await supabase.rpc('unhide_hr_profile_rpc', { p_user_id: id });
    if (error) throw error;
};

export const updateHRProfile = async (id: string, updates: Partial<HRProfile>) => {
    // Filter out restricted fields
    const { department, email, role, ...cleanUpdates } = updates as any;

    const { data, error } = await supabase.rpc('update_hr_profile_rpc', {
        p_id: id,
        p_full_name: cleanUpdates.full_name,
        p_phone: cleanUpdates.phone,
        p_dob: cleanUpdates.dob || null,
        p_place_of_origin: cleanUpdates.place_of_origin,
        p_identity_card: cleanUpdates.identity_card,
        p_education_school: cleanUpdates.education_school,
        p_education_major: cleanUpdates.education_major,
        p_interests: cleanUpdates.interests,
        p_social_facebook: cleanUpdates.social_facebook,
        p_department_id: cleanUpdates.department_id || null,
        p_position: cleanUpdates.position,
        p_work_type: cleanUpdates.work_type,
        p_start_date: cleanUpdates.start_date || null,
        p_employee_code: cleanUpdates.employee_code
    });

    if (error) throw error;
    return data;
};

// BIRTHDAYS (UPCOMING)
export const getUpcomingBirthdays = async () => {
    // Current logic: Fetch all and filter in JS (simpler for small teams than complex SQL date math)
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, dob, department:departments!profiles_department_id_fkey(name)')
        .not('dob', 'is', null);

    if (error) throw error;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const birthdays = (data as HRProfile[]).map(p => {
        if (!p.dob) return null;
        const dob = new Date(p.dob);
        const day = dob.getDate();
        const month = dob.getMonth();

        // Check if in current month
        if (month === currentMonth) {
            return { ...p, day, month };
        }
        return null;
    }).filter(p => p !== null);

    // Sort by day
    return birthdays.sort((a, b) => (a!.day - b!.day)) as (HRProfile & { day: number, month: number })[];
};

// -- SCHEDULING & SHIFTS --

export interface WorkShift {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

export interface WeeklySchedule {
    id: string;
    week_number: number;
    year: number;
    status: 'draft' | 'open' | 'closed' | 'published';
    banner_url?: string;
    poster_url?: string;
    poster_url_2?: string;
    poster_url_3?: string;
    theme_color?: string;
    lock_note?: string;
    created_at: string;
}

export interface ShiftRegistration {
    id: string;
    schedule_id: string;
    user_id: string;
    shift_id: string;
    date: string;
    note?: string; // New
    status: 'pending' | 'approved' | 'rejected';
    user?: {
        full_name: string;
        email: string;
        avatar_url?: string;
    };
    shift?: WorkShift;
}

// Removed WeeklyUserNote interface

export const getWorkShifts = async () => {
    const { data, error } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('is_active', true)
        .order('start_time');

    if (error) throw error;
    return data as WorkShift[];
};

export const getWeeklySchedules = async () => {
    const { data, error } = await supabase
        .from('weekly_schedules')
        .select('*')
        .order('year', { ascending: false })
        .order('week_number', { ascending: false });

    if (error) throw error;
    return data as WeeklySchedule[];
};

export const createWeeklySchedule = async (week: number, year: number) => {
    const { data, error } = await supabase
        .from('weekly_schedules')
        .insert([{ week_number: week, year, status: 'open' }])
        .select()
        .single();

    if (error) throw error;
    return data as WeeklySchedule;
};

export const updateWeeklySchedule = async (id: string, updates: Partial<WeeklySchedule>) => {
    const { data, error } = await supabase
        .from('weekly_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as WeeklySchedule;
};

export const getShiftRegistrations = async (scheduleId: string) => {
    const { data, error } = await supabase
        .from('shift_registrations')
        .select(`
            *,
            user:profiles(full_name, email, avatar_url),
            shift:work_shifts(*)
        `)
        .eq('schedule_id', scheduleId);

    if (error) throw error;
    return data as ShiftRegistration[];
};

export const registerShift = async (userId: string, scheduleId: string, shiftId: string, date: string, note?: string) => {
    const { data, error } = await supabase
        .from('shift_registrations')
        .insert([{ user_id: userId, schedule_id: scheduleId, shift_id: shiftId, date, status: 'pending', note }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteRegistration = async (id: string, userId: string) => {
    const { error } = await supabase
        .from('shift_registrations')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const updateRegistrationStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { data, error } = await supabase
        .from('shift_registrations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Removed WeeklyUserNote functions

// -- ASSETS --

export const uploadHRAsset = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('hr-assets')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('hr-assets')
        .getPublicUrl(filePath);

    return publicUrl;
};

// -- CULTURE & FUND --

export interface CultureEvent {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time?: string;
    type: 'event' | 'meeting' | 'holiday' | 'party';
    created_at: string;
}

export interface FundTransaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    category?: string;
    created_at: string;
    attachment_url?: string;
}

export const getCultureEvents = async () => {
    const { data, error } = await supabase
        .from('culture_events')
        .select('*')
        .order('start_time', { ascending: true })
        .gte('start_time', new Date().toISOString()); // Only upcoming

    if (error) throw error;
    return data as CultureEvent[];
};

export const getFundTransactions = async () => {
    const { data, error } = await supabase
        .from('fund_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20); // Last 20 transactions

    if (error) throw error;
    return data as FundTransaction[];
};

export const getFundBalance = async () => {
    // 1. Transactions (Income/Expense)
    const { data: transData, error: transErr } = await supabase.from('fund_transactions').select('amount, type');
    if (transErr) throw transErr;
    const transBalance = (transData || []).reduce((acc: number, curr: any) => {
        return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
    }, 0);

    // 2. Confirmed Contributions
    const { data: contribData, error: contribErr } = await supabase.from('fund_contributions').select('amount').eq('status', 'confirmed');
    if (contribErr) throw contribErr;
    const contribBalance = (contribData || []).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

    // 3. Initial Balance from Settings
    const { data: configData } = await supabase.from('app_settings').select('fund_bank_config').single();
    const initialBalance = configData?.fund_bank_config?.initialBalance || 0;

    return transBalance + contribBalance + Number(initialBalance);
};

export const addFundTransaction = async (transaction: Partial<FundTransaction> & Omit<FundTransaction, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
        .from('fund_transactions')
        .insert([transaction])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateFundTransaction = async (id: string, updates: Partial<Omit<FundTransaction, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase
        .from('fund_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteFundTransaction = async (id: string) => {
    const { error } = await supabase.from('fund_transactions').delete().eq('id', id);
    if (error) throw error;
};

export const uploadReceiptImages = async (files: File[]) => {
    const urls: string[] = [];
    for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const { error, data } = await supabase.storage
            .from('hr-assets')
            .upload(`receipts/${fileName}`, file);
            
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
            .from('hr-assets')
            .getPublicUrl(`receipts/${fileName}`);
            
        urls.push(urlData.publicUrl);
    }
    return urls;
};

// -- FUND CONTRIBUTIONS --

export interface FundContribution {
    id: string;
    user_id: string;
    month: number;
    year: number;
    amount: number;
    status: 'pending' | 'paid' | 'confirmed';
    confirmed_by?: string;
    confirmed_at?: string;
    note?: string;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url?: string;
    };
}

export const getFundContributions = async (month: number, year: number): Promise<FundContribution[]> => {
    const { data, error } = await supabase
        .from('fund_contributions')
        .select('*, user:profiles!fund_contributions_user_id_fkey(full_name, avatar_url)')
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as FundContribution[];
};

export const upsertFundContribution = async (userId: string, month: number, year: number, status: string = 'paid') => {
    const { data, error } = await supabase
        .from('fund_contributions')
        .upsert({
            user_id: userId,
            month,
            year,
            amount: 50000,
            status
        }, { onConflict: 'user_id,month,year' })
        .select()
        .single();

    if (error) throw error;
    return data as FundContribution;
};

export const unmarkFundPaid = async (userId: string, month: number, year: number) => {
    const { error } = await supabase
        .from('fund_contributions')
        .delete()
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year);
    if (error) throw error;
};

export const confirmFundContribution = async (contributionId: string, adminId: string) => {
    const { data, error } = await supabase
        .from('fund_contributions')
        .update({
            status: 'confirmed',
            confirmed_by: adminId,
            confirmed_at: new Date().toISOString()
        })
        .eq('id', contributionId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getFundMonthlyReport = async (month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
        .from('fund_transactions')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const transactions = (data || []) as FundTransaction[];
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    // Group by category
    const byCategory: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
        const cat = t.category || 'Khác';
        if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0 };
        byCategory[cat][t.type] += Number(t.amount);
    });

    return { transactions, totalIncome, totalExpense, byCategory };
};
