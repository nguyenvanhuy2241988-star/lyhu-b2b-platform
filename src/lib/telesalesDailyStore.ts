// lib/telesalesDailyStore.ts
import { supabase } from '@/lib/supabaseClient';

export interface TelesalesDailyActivity {
    id: string;
    user_id: string;
    report_date: string;
    calls_completed: number;
    fb_group_posts: number;
    fb_comments: number;
    fb_friends: number;
    fb_personal_posts: number;
    zalo_posts: number;
    self_sourced_data: number;
    issues: string;
    request_support: string;
    other_tasks?: string;
    plan_next_day?: string;
    created_at?: string;
}

export const getDailyReportTelesales = async (date: string, userId: string) => {
    const { data, error } = await supabase
        .from('telesales_daily_activities')
        .select('*')
        .eq('report_date', date)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data as TelesalesDailyActivity | null;
};

export const getMyReportsHistoryTelesales = async (userId: string, limit: number = 30) => {
    const { data, error } = await supabase
        .from('telesales_daily_activities')
        .select('*')
        .eq('user_id', userId)
        .order('report_date', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as TelesalesDailyActivity[];
};

export const upsertDailyReportTelesales = async (reportData: Partial<TelesalesDailyActivity>) => {
    const { user_id, report_date } = reportData;
    if (!user_id || !report_date) throw new Error("Missing user_id or date");

    const { data: existing } = await supabase
        .from('telesales_daily_activities')
        .select('id')
        .eq('user_id', user_id)
        .eq('report_date', report_date)
        .maybeSingle();

    if (existing) {
        // Update
        const { error } = await supabase
            .from('telesales_daily_activities')
            .update({
                calls_completed: reportData.calls_completed ?? 0,
                fb_group_posts: reportData.fb_group_posts ?? 0,
                fb_comments: reportData.fb_comments ?? 0,
                fb_friends: reportData.fb_friends ?? 0,
                fb_personal_posts: reportData.fb_personal_posts ?? 0,
                zalo_posts: reportData.zalo_posts ?? 0,
                self_sourced_data: reportData.self_sourced_data ?? 0,
                issues: reportData.issues ?? "",
                request_support: reportData.request_support ?? "",
                other_tasks: reportData.other_tasks ?? "",
                plan_next_day: reportData.plan_next_day ?? ""
            })
            .eq('id', existing.id);

        if (error) throw error;
    } else {
        // Insert
        const { error } = await supabase
            .from('telesales_daily_activities')
            .insert([{
                user_id: reportData.user_id,
                report_date: reportData.report_date,
                calls_completed: reportData.calls_completed ?? 0,
                fb_group_posts: reportData.fb_group_posts ?? 0,
                fb_comments: reportData.fb_comments ?? 0,
                fb_friends: reportData.fb_friends ?? 0,
                fb_personal_posts: reportData.fb_personal_posts ?? 0,
                zalo_posts: reportData.zalo_posts ?? 0,
                self_sourced_data: reportData.self_sourced_data ?? 0,
                issues: reportData.issues ?? "",
                request_support: reportData.request_support ?? "",
                other_tasks: reportData.other_tasks ?? "",
                plan_next_day: reportData.plan_next_day ?? ""
            }]);

        if (error) throw error;
    }
    return true;
};

export interface TelesalesKpiSettings {
    user_id: string;
    calls_target: number;
    self_sourced_data_target: number;
    fb_group_posts_target: number;
    fb_comments_target: number;
    fb_friends_target: number;
    fb_personal_posts_target: number;
    zalo_posts_target: number;
}

export interface TelesalesKpiStats extends TelesalesKpiSettings {
    calls_count: number;
    self_sourced_data_count: number;
    fb_group_posts_count: number;
    fb_comments_count: number;
    fb_friends_count: number;
    fb_personal_posts_count: number;
    zalo_posts_count: number;
}

export const getTelesalesKpiStats = async (userId: string, date: string): Promise<TelesalesKpiStats> => {
    // 1. Get Settings
    const { data: settingsData, error: settingsError } = await supabase
        .from('telesales_kpi_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') {
        console.error("Error fetching KPI settings:", settingsError);
    }

    const defaultSettings: TelesalesKpiSettings = {
        user_id: userId,
        calls_target: 50,
        self_sourced_data_target: 10,
        fb_group_posts_target: 20,
        fb_comments_target: 50,
        fb_friends_target: 10,
        fb_personal_posts_target: 5,
        zalo_posts_target: 5
    };

    const settings: TelesalesKpiSettings = settingsData || defaultSettings;

    // 2. Get Today's Report
    const report = await getDailyReportTelesales(date, userId);

    const stats: TelesalesKpiStats = {
        ...settings,
        calls_count: report?.calls_completed || 0,
        self_sourced_data_count: report?.self_sourced_data || 0,
        fb_group_posts_count: report?.fb_group_posts || 0,
        fb_comments_count: report?.fb_comments || 0,
        fb_friends_count: report?.fb_friends || 0,
        fb_personal_posts_count: report?.fb_personal_posts || 0,
        zalo_posts_count: report?.zalo_posts || 0
    };

    return stats;
};

export const updateTelesalesKpiSettings = async (settings: TelesalesKpiSettings) => {
    const { user_id, ...targets } = settings;

    // Check if exists
    const { data: existing } = await supabase
        .from('telesales_kpi_settings')
        .select('user_id')
        .eq('user_id', user_id)
        .maybeSingle();

    if (existing) {
        const { error } = await supabase
            .from('telesales_kpi_settings')
            .update({ ...targets, updated_at: new Date().toISOString() })
            .eq('user_id', user_id);
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('telesales_kpi_settings')
            .insert([{ user_id, ...targets }]);
        if (error) throw error;
    }
    return true;
};
