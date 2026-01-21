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
