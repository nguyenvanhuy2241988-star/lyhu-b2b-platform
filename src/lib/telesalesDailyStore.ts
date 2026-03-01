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
 * Sync calls_completed from actual CRM activity records.
 * Counts DISTINCT deals with at least one 'answered' call today.
 * This ensures each deal is only counted once per day for KPI.
 * Uses LOCAL timezone boundaries (not UTC) to match user's day.
 */
export const syncCallsFromCRM = async (userId: string, date: string) => {
    try {
        // Use local timezone boundaries (browser timezone = Vietnam UTC+7)
        const dayStart = new Date(`${date}T00:00:00`);
        const dayEnd = new Date(`${date}T23:59:59.999`);
        const startOfDay = dayStart.toISOString();
        const endOfDay = dayEnd.toISOString();

        const { data: answeredCalls, error: callsError } = await supabase
            .from('crm_activities')
            .select('deal_id')
            .eq('user_id', userId)
            .eq('type', 'call')
            .eq('call_result', 'answered')
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay);

        if (callsError) {
            console.error("Error fetching CRM calls:", callsError);
            return;
        }

        // Count unique deals (1 call per deal per day)
        const uniqueDeals = new Set((answeredCalls || []).map((c: any) => c.deal_id));
        const callCount = uniqueDeals.size;

        // Sync to daily activities
        const existing = await getDailyReportTelesales(date, userId);

        if (existing) {
            const { error } = await supabase
                .from('telesales_daily_activities')
                .update({ calls_completed: callCount })
                .eq('id', existing.id);
            if (error) console.error("Error syncing calls_completed:", error);
        } else if (callCount > 0) {
            const { error } = await supabase
                .from('telesales_daily_activities')
                .insert([{
                    user_id: userId,
                    report_date: date,
                    calls_completed: callCount,
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
        console.error("syncCallsFromCRM error:", err);
    }
};

// Backward compatibility alias
export const incrementCallsCompleted = syncCallsFromCRM;

/**
 * Sync self_sourced_data count from CRM deals.
 * Counts DISTINCT customers that:
 * 1. Were CREATED TODAY by this user (new customers only, not old data)
 * 2. Have at least one deal with source_category = 'SELF_FOUND'
 * Multiple deals for the same new customer = 1 count.
 * Old customers (created before today) selecting "Tự tìm" = 0.
 */
export const syncSelfSourcedFromCRM = async (userId: string, date: string) => {
    try {
        const dayStart = new Date(`${date}T00:00:00`);
        const dayEnd = new Date(`${date}T23:59:59.999`);

        // Step 1: Get deals with SELF_FOUND created today by this user
        const { data: deals, error } = await supabase
            .from('crm_deals')
            .select('customer_id')
            .eq('owner_user_id', userId)
            .eq('source_category', 'SELF_FOUND')
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());

        if (error) {
            console.error("Error fetching self-sourced deals:", error);
            return;
        }

        // Get unique customer IDs from these deals
        const customerIds = Array.from(new Set((deals || []).map((d: any) => d.customer_id).filter(Boolean)));

        let count = 0;

        if (customerIds.length > 0) {
            // Step 2: Check which of these customers were ALSO created today (= new customers)
            const { data: newCustomers, error: custError } = await supabase
                .from('customers')
                .select('id')
                .in('id', customerIds)
                .gte('created_at', dayStart.toISOString())
                .lte('created_at', dayEnd.toISOString());

            if (custError) {
                console.error("Error checking customer creation dates:", custError);
                return;
            }

            count = (newCustomers || []).length;
        }

        // Sync to daily activities
        const existing = await getDailyReportTelesales(date, userId);

        if (existing) {
            const { error: upErr } = await supabase
                .from('telesales_daily_activities')
                .update({ self_sourced_data: count })
                .eq('id', existing.id);
            if (upErr) console.error("Error syncing self_sourced_data:", upErr);
        } else if (count > 0) {
            const { error: insErr } = await supabase
                .from('telesales_daily_activities')
                .insert([{
                    user_id: userId,
                    report_date: date,
                    calls_completed: 0,
                    fb_group_posts: 0,
                    fb_comments: 0,
                    fb_friends: 0,
                    fb_personal_posts: 0,
                    zalo_posts: 0,
                    self_sourced_data: count
                }]);
            if (insErr) console.error("Error creating daily activity for self-sourced:", insErr);
        }
    } catch (err) {
        console.error("syncSelfSourcedFromCRM error:", err);
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

export const getTelesalesKpiStats = async (userId: string, date: string, toDate?: string): Promise<TelesalesKpiStats> => {
    // 1. Get Settings from telesales_kpi_settings (legacy)
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

    let settings: TelesalesKpiSettings = settingsData || defaultSettings;

    // 1b. Override targets from user_kpi_settings (payroll module) if available
    // Payroll targets are MONTHLY values, legacy telesales_kpi_settings are DAILY
    let isMonthlyTargets = false;
    const { data: payrollKpi } = await supabase
        .from('user_kpi_settings')
        .select('kpi_targets')
        .eq('user_id', userId)
        .maybeSingle();

    if (payrollKpi?.kpi_targets) {
        const pt = payrollKpi.kpi_targets as Record<string, number>;
        settings = {
            ...settings,
            calls_target: pt.calls || pt.calls_target || settings.calls_target,
            self_sourced_data_target: pt.self_sourced || pt.self_sourced_data || pt.self_sourced_data_target || settings.self_sourced_data_target,
            fb_group_posts_target: pt.fb_group_posts || pt.fb_group_posts_target || settings.fb_group_posts_target,
            fb_comments_target: pt.fb_comments || pt.fb_comments_target || settings.fb_comments_target,
            fb_friends_target: pt.fb_friends || pt.fb_friends_target || settings.fb_friends_target,
            fb_personal_posts_target: pt.fb_personal_posts || pt.fb_personal_posts_target || settings.fb_personal_posts_target,
            zalo_posts_target: pt.zalo_posts || pt.zalo_posts_target || settings.zalo_posts_target,
        };
        isMonthlyTargets = true;
    } else {
        // Legacy targets are daily — convert to monthly (×26 working days)
        settings = {
            ...settings,
            calls_target: settings.calls_target * 26,
            self_sourced_data_target: settings.self_sourced_data_target * 26,
            fb_group_posts_target: settings.fb_group_posts_target * 26,
            fb_comments_target: settings.fb_comments_target * 26,
            fb_friends_target: settings.fb_friends_target * 26,
            fb_personal_posts_target: settings.fb_personal_posts_target * 26,
            zalo_posts_target: settings.zalo_posts_target * 26,
        };
        isMonthlyTargets = true;
    }

    // 2. Get reports for date range
    if (toDate && toDate !== date) {
        // Date range query - aggregate across days
        const { data: reports } = await supabase
            .from('telesales_daily_activities')
            .select('*')
            .eq('user_id', userId)
            .gte('report_date', date)
            .lte('report_date', toDate);

        const agg = { calls_count: 0, self_sourced_data_count: 0, fb_group_posts_count: 0, fb_comments_count: 0, fb_friends_count: 0, fb_personal_posts_count: 0, zalo_posts_count: 0 };
        for (const r of (reports as any[] || [])) {
            agg.calls_count += r.calls_completed || 0;
            agg.self_sourced_data_count += r.self_sourced_data || 0;
            agg.fb_group_posts_count += r.fb_group_posts || 0;
            agg.fb_comments_count += r.fb_comments || 0;
            agg.fb_friends_count += r.fb_friends || 0;
            agg.fb_personal_posts_count += r.fb_personal_posts || 0;
            agg.zalo_posts_count += r.zalo_posts || 0;
        }

        // Targets are already monthly — return as-is (no daysDiff scaling)
        return {
            ...settings,
            ...agg
        };
    }

    // Single day query - compute calls & self-sourced directly from CRM tables
    const report = await getDailyReportTelesales(date, userId);

    // Compute calls_count directly from crm_activities (source of truth)
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);

    const { data: answeredCalls } = await supabase
        .from('crm_activities')
        .select('deal_id')
        .eq('user_id', userId)
        .eq('type', 'call')
        .eq('call_result', 'answered')
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

    const uniqueCallDeals = new Set((answeredCalls || []).map((c: any) => c.deal_id));
    const liveCallsCount = uniqueCallDeals.size;

    // Compute self_sourced_data: deals with is_new_customer=true AND source_category=SELF_FOUND
    const { data: selfFoundDeals } = await supabase
        .from('crm_deals')
        .select('id')
        .eq('owner_user_id', userId)
        .eq('source_category', 'SELF_FOUND')
        .eq('is_new_customer', true)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

    // Count distinct deals (each new customer deal = 1 self-sourced)
    const liveSelfSourcedCount = (selfFoundDeals || []).length;

    const stats: TelesalesKpiStats = {
        ...settings,
        calls_count: liveCallsCount,
        self_sourced_data_count: liveSelfSourcedCount,
        fb_group_posts_count: report?.fb_group_posts || 0,
        fb_comments_count: report?.fb_comments || 0,
        fb_friends_count: report?.fb_friends || 0,
        fb_personal_posts_count: report?.fb_personal_posts || 0,
        zalo_posts_count: report?.zalo_posts || 0
    };

    return stats;
};

export const getTeamTelesalesKpiStats = async (date: string, toDate?: string): Promise<TelesalesKpiStats> => {
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

    // 2. Lấy cài đặt KPI của các nhân sự (legacy)
    const { data: settingsData } = await supabase
        .from('telesales_kpi_settings')
        .select('*')
        .in('user_id', telesalesUserIds);

    const settingsMap = new Map((settingsData || []).map((s: any) => [s.user_id, s]));

    // 2b. Override with payroll targets (user_kpi_settings)
    const { data: payrollSettings } = await supabase
        .from('user_kpi_settings')
        .select('user_id, kpi_targets')
        .in('user_id', telesalesUserIds);

    const payrollMap = new Map((payrollSettings || []).map((s: any) => [s.user_id, s.kpi_targets || {}]));

    const defaultSettings: any = {
        calls_target: 50, self_sourced_data_target: 10, fb_group_posts_target: 20, fb_comments_target: 50, fb_friends_target: 10, fb_personal_posts_target: 5, zalo_posts_target: 5
    };

    const aggregatedTargets = { calls_target: 0, self_sourced_data_target: 0, fb_group_posts_target: 0, fb_comments_target: 0, fb_friends_target: 0, fb_personal_posts_target: 0, zalo_posts_target: 0 };

    // Convert legacy daily targets to monthly (×26)
    for (const uid of telesalesUserIds) {
        const s: any = settingsMap.get(uid) || defaultSettings;
        const pt = (payrollMap.get(uid) || {}) as Record<string, number>;

        // Priority: payroll targets (monthly) > telesales_kpi_settings×26 (daily→monthly) > default×26
        const hasPayroll = Object.keys(pt).length > 0;
        const mul = hasPayroll ? 1 : 26; // convert daily to monthly if no payroll targets

        aggregatedTargets.calls_target += (pt.calls || pt.calls_target || s.calls_target || 0) * mul;
        aggregatedTargets.self_sourced_data_target += (pt.self_sourced || pt.self_sourced_data || pt.self_sourced_data_target || s.self_sourced_data_target || 0) * mul;
        aggregatedTargets.fb_group_posts_target += (pt.fb_group_posts || pt.fb_group_posts_target || s.fb_group_posts_target || 0) * mul;
        aggregatedTargets.fb_comments_target += (pt.fb_comments || pt.fb_comments_target || s.fb_comments_target || 0) * mul;
        aggregatedTargets.fb_friends_target += (pt.fb_friends || pt.fb_friends_target || s.fb_friends_target || 0) * mul;
        aggregatedTargets.fb_personal_posts_target += (pt.fb_personal_posts || pt.fb_personal_posts_target || s.fb_personal_posts_target || 0) * mul;
        aggregatedTargets.zalo_posts_target += (pt.zalo_posts || pt.zalo_posts_target || s.zalo_posts_target || 0) * mul;
    }

    // Targets are now monthly — no daysDiff scaling needed

    // 3. Compute calls & self-sourced directly from CRM tables (source of truth)
    const queryEndDate = toDate || date;
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${queryEndDate}T23:59:59.999`);

    // Count answered calls (unique deal per user per day)
    const { data: allCalls } = await supabase
        .from('crm_activities')
        .select('deal_id, user_id')
        .in('user_id', telesalesUserIds)
        .eq('type', 'call')
        .eq('call_result', 'answered')
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

    const uniqueCallKeys = new Set((allCalls || []).map((c: any) => `${c.user_id}:${c.deal_id}`));
    const totalCallsCount = uniqueCallKeys.size;

    // Count self-sourced deals (is_new_customer=true AND source_category=SELF_FOUND)
    const { data: allSelfFound } = await supabase
        .from('crm_deals')
        .select('id')
        .in('owner_user_id', telesalesUserIds)
        .eq('source_category', 'SELF_FOUND')
        .eq('is_new_customer', true)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

    const totalSelfSourcedCount = (allSelfFound || []).length;

    // 4. Get other KPI counts from telesales_daily_activities (manual input fields)
    let query = supabase
        .from('telesales_daily_activities')
        .select('*')
        .in('user_id', telesalesUserIds);

    if (toDate && toDate !== date) {
        query = query.gte('report_date', date).lte('report_date', toDate);
    } else {
        query = query.eq('report_date', date);
    }

    const { data: reports } = await query;

    const otherCounts = { fb_group_posts_count: 0, fb_comments_count: 0, fb_friends_count: 0, fb_personal_posts_count: 0, zalo_posts_count: 0 };
    for (const r of (reports as any[] || [])) {
        otherCounts.fb_group_posts_count += r.fb_group_posts || 0;
        otherCounts.fb_comments_count += r.fb_comments || 0;
        otherCounts.fb_friends_count += r.fb_friends || 0;
        otherCounts.fb_personal_posts_count += r.fb_personal_posts || 0;
        otherCounts.zalo_posts_count += r.zalo_posts || 0;
    }

    return {
        user_id: 'ALL',
        ...aggregatedTargets,
        calls_count: totalCallsCount,
        self_sourced_data_count: totalSelfSourcedCount,
        ...otherCounts
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
