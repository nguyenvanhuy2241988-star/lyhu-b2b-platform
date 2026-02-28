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
    notes?: string;
    issues?: string;
    request_support?: string;
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
                notes: reportData.notes ?? "",
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
                notes: reportData.notes ?? "",
                issues: reportData.issues ?? "",
                request_support: reportData.request_support ?? "",
                other_tasks: reportData.other_tasks ?? "",
                plan_next_day: reportData.plan_next_day ?? ""
            }]);

        if (error) throw error;
    }
    return true;
};

/**
 * Increment calls_completed by 1 for a given user and date.
 * Used when a CRM call is logged with result 'answered' (Nghe máy).
 * Other call results (no_answer, busy, wrong_number, callback, voicemail) are NOT counted for KPI.
 */
export const incrementCallsCompleted = async (userId: string, date: string) => {
    try {
        const existing = await getDailyReportTelesales(date, userId);

        if (existing) {
            // Increment existing counter
            const { error } = await supabase
                .from('telesales_daily_activities')
                .update({ calls_completed: (existing.calls_completed || 0) + 1 })
                .eq('id', existing.id);
            if (error) console.error("Error incrementing calls_completed:", error);
        } else {
            // Create new row with calls_completed = 1
            const { error } = await supabase
                .from('telesales_daily_activities')
                .insert([{
                    user_id: userId,
                    report_date: date,
                    calls_completed: 1,
                    fb_group_posts: 0,
                    fb_comments: 0,
                    fb_friends: 0,
                    fb_personal_posts: 0,
                    zalo_posts: 0,
                    self_sourced_data: 0
                }]);
            if (error) console.error("Error creating daily activity for call:", error);
        }
    } catch (err) {
        console.error("incrementCallsCompleted error:", err);
    }
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

export const getTeamTelesalesKpiStats = async (date: string): Promise<TelesalesKpiStats> => {
    // 1. Lấy danh sách nhân sự Telesales
    const { data: usersData } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['telesales', 'sale_admin']);

    const telesalesUserIds = (usersData || []).map((u: any) => u.id);

    if (telesalesUserIds.length === 0) {
        return {
            user_id: 'ALL',
            calls_target: 0, self_sourced_data_target: 0, fb_group_posts_target: 0, fb_comments_target: 0, fb_friends_target: 0, fb_personal_posts_target: 0, zalo_posts_target: 0,
            calls_count: 0, self_sourced_data_count: 0, fb_group_posts_count: 0, fb_comments_count: 0, fb_friends_count: 0, fb_personal_posts_count: 0, zalo_posts_count: 0
        };
    }

    // 2. Lấy cài đặt KPI của các nhân sự
    const { data: settingsData } = await supabase
        .from('telesales_kpi_settings')
        .select('*')
        .in('user_id', telesalesUserIds);

    const settingsMap = new Map((settingsData || []).map((s: any) => [s.user_id, s]));

    const defaultSettings: any = {
        calls_target: 50, self_sourced_data_target: 10, fb_group_posts_target: 20, fb_comments_target: 50, fb_friends_target: 10, fb_personal_posts_target: 5, zalo_posts_target: 5
    };

    const aggregatedTargets = { calls_target: 0, self_sourced_data_target: 0, fb_group_posts_target: 0, fb_comments_target: 0, fb_friends_target: 0, fb_personal_posts_target: 0, zalo_posts_target: 0 };

    for (const uid of telesalesUserIds) {
        const s: any = settingsMap.get(uid) || defaultSettings;
        aggregatedTargets.calls_target += s.calls_target || 0;
        aggregatedTargets.self_sourced_data_target += s.self_sourced_data_target || 0;
        aggregatedTargets.fb_group_posts_target += s.fb_group_posts_target || 0;
        aggregatedTargets.fb_comments_target += s.fb_comments_target || 0;
        aggregatedTargets.fb_friends_target += s.fb_friends_target || 0;
        aggregatedTargets.fb_personal_posts_target += s.fb_personal_posts_target || 0;
        aggregatedTargets.zalo_posts_target += s.zalo_posts_target || 0;
    }

    // 3. Lấy báo cáo hàng ngày
    const { data: reports } = await supabase
        .from('telesales_daily_activities')
        .select('*')
        .eq('report_date', date)
        .in('user_id', telesalesUserIds);

    const aggregatedCounts = { calls_count: 0, self_sourced_data_count: 0, fb_group_posts_count: 0, fb_comments_count: 0, fb_friends_count: 0, fb_personal_posts_count: 0, zalo_posts_count: 0 };

    for (const r of (reports as any[] || [])) {
        aggregatedCounts.calls_count += r.calls_completed || 0;
        aggregatedCounts.self_sourced_data_count += r.self_sourced_data || 0;
        aggregatedCounts.fb_group_posts_count += r.fb_group_posts || 0;
        aggregatedCounts.fb_comments_count += r.fb_comments || 0;
        aggregatedCounts.fb_friends_count += r.fb_friends || 0;
        aggregatedCounts.fb_personal_posts_count += r.fb_personal_posts || 0;
        aggregatedCounts.zalo_posts_count += r.zalo_posts || 0;
    }

    return {
        user_id: 'ALL',
        ...aggregatedTargets,
        ...aggregatedCounts
    };
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

// ==========================================
// EVIDENCE LOGS (POST LOGS) FOR TELESALES
// ==========================================
export interface TelesalesPostLog {
    id: string;
    user_id: string;
    report_date: string;
    platform: string;
    activity_type: string;
    group_name?: string;
    group_link?: string;
    post_link: string;
    image_url?: string;
    group_note?: string;
    content_excerpt?: string;
    created_at?: string;
}

export const getTelesalesPostLogs = async (userId: string, date: string) => {
    const { data, error } = await supabase
        .from('telesales_post_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('report_date', date)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TelesalesPostLog[];
};

export const createTelesalesPostLog = async (logData: Omit<TelesalesPostLog, 'id' | 'created_at'>) => {
    const { error } = await supabase
        .from('telesales_post_logs')
        .insert([logData]);

    if (error) throw error;
    return true;
};

export const updateTelesalesPostLog = async (id: string, logData: Partial<TelesalesPostLog>) => {
    const { error } = await supabase
        .from('telesales_post_logs')
        .update(logData)
        .eq('id', id);

    if (error) throw error;
    return true;
};

export const deleteTelesalesPostLog = async (id: string) => {
    const { error } = await supabase
        .from('telesales_post_logs')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

// Sync Post Logs count back to Daily Report
export const syncTelesalesLogsToDailyReport = async (userId: string, date: string) => {
    try {
        const logs = await getTelesalesPostLogs(userId, date);
        const fbGroupPosts = logs.filter(l => l.platform === 'facebook_group' && l.activity_type === 'post').length;
        const fbPersonalPosts = logs.filter(l => l.platform === 'facebook_personal' && l.activity_type === 'post').length;
        const fbComments = logs.filter(l => l.platform.includes('facebook') && l.activity_type === 'comment').length;
        const fbFriends = logs.filter(l => l.platform.includes('facebook') && l.activity_type === 'friend').length;
        const zaloPosts = logs.filter(l => l.platform === 'zalo' && (l.activity_type === 'post' || l.activity_type === 'message')).length;

        // Ensure a daily report exists
        const report = await getDailyReportTelesales(date, userId);

        await upsertDailyReportTelesales({
            user_id: userId,
            report_date: date,
            calls_completed: report?.calls_completed || 0,
            self_sourced_data: report?.self_sourced_data || 0,
            fb_group_posts: fbGroupPosts,
            fb_personal_posts: fbPersonalPosts,
            fb_comments: fbComments,
            fb_friends: fbFriends,
            zalo_posts: zaloPosts,
            notes: report?.notes || "",
        });
    } catch (e) {
        console.error("Error syncing logs to report:", e);
    }
};
