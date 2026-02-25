// lib/telesalesDailyStore.ts
import { supabase } from '@/lib/supabaseClient';

export interface TelesalesDailyActivity {
    id: string;
    user_id: string;
    date: string;
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
        .eq('date', date)
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
        .order('date', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as TelesalesDailyActivity[];
};

export const upsertDailyReportTelesales = async (reportData: Partial<TelesalesDailyActivity>) => {
    const { user_id, date } = reportData;
    if (!user_id || !date) throw new Error("Missing user_id or date");

    const { data: existing } = await supabase
        .from('telesales_daily_activities')
        .select('id')
        .eq('user_id', user_id)
        .eq('date', date)
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
                date: reportData.date,
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
