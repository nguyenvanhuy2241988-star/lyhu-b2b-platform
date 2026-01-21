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
export const getHRProfiles = async (departmentId?: string) => {
    let query = supabase
        .from('profiles')
        .select(`
            *,
            department:departments!profiles_department_id_fkey(name)
        `)
        .order('full_name');

    if (departmentId) {
        query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as HRProfile[];
};

export const updateHRProfile = async (id: string, updates: Partial<HRProfile>) => {
    // Filter out nested objects
    const { department, email, role, ...cleanUpdates } = updates as any;

    const { data, error } = await supabase
        .from('profiles')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// BIRTHDAYS (UPCOMING)
export const getUpcomingBirthdays = async () => {
    // Current logic: Fetch all and filter in JS (simpler for small teams than complex SQL date math)
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, dob, department:departments(name)')
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

        // Check if in current month or next month
        // Simple logic: Just return if it's this month for now
        if (month === currentMonth && day >= currentDay) {
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
    created_at: string;
}

export interface ShiftRegistration {
    id: string;
    schedule_id: string;
    user_id: string;
    shift_id: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    user?: {
        full_name: string;
        email: string;
    };
    shift?: WorkShift;
}

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

export const getShiftRegistrations = async (scheduleId: string) => {
    const { data, error } = await supabase
        .from('shift_registrations')
        .select(`
            *,
            user:profiles(full_name, email),
            shift:work_shifts(*)
        `)
        .eq('schedule_id', scheduleId);

    if (error) throw error;
    return data as ShiftRegistration[];
};

export const registerShift = async (userId: string, scheduleId: string, shiftId: string, date: string) => {
    const { data, error } = await supabase
        .from('shift_registrations')
        .insert([{ user_id: userId, schedule_id: scheduleId, shift_id: shiftId, date, status: 'pending' }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteRegistration = async (id: string, userId: string) => {
    // RLS policy ensures user can only delete own pending
    // But we pass UserId just to be explicit if needed, though ID is unique
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
    // Simple calculation from recent history or creating a separate RPC/View is better for real apps
    // For MVP/Demo: Fetch all and sum (warning: performance heavy later)
    // Optimization: We will just fetch all for now as dataset is small.
    const { data, error } = await supabase
        .from('fund_transactions')
        .select('amount, type');

    if (error) throw error;

    const balance = (data || []).reduce((acc: number, curr: any) => {
        return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
    }, 0);

    return balance;
};
