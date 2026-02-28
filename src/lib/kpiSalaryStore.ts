// lib/kpiSalaryStore.ts
// KPI Metric Definitions + Salary calculation based on KPI completion

import { supabase } from '@/lib/supabaseClient';

// =====================================================
// TYPES
// =====================================================

export interface KpiMetricDefinition {
    id: string;
    key: string;
    label: string;
    description: string;
    data_source: 'auto' | 'manual';
    icon: string;
    field_type: 'number' | 'currency' | 'percentage';
    is_active: boolean;
    sort_order: number;
    salary_percent: number;
    monthly_target: number;
    created_at?: string;
    updated_at?: string;
}

export interface KpiUserTarget {
    user_id: string;
    metric_key: string;
    monthly_target: number;
}

export interface KpiSalaryLineItem {
    key: string;
    label: string;
    target: number;
    actual: number;
    completionPercent: number;  // min(actual/target, 1) * 100
    salaryPercent: number;      // weight in salary
    salaryAmount: number;       // baseSalary * salaryPercent% * completionPercent%
    field_type: string;
}

export interface KpiSalaryResult {
    baseSalary: number;
    items: KpiSalaryLineItem[];
    totalKpiSalary: number;
    totalSalaryPercent: number; // sum of all salary_percent
}

// =====================================================
// CRUD: KPI Metric Definitions
// =====================================================

export const fetchKpiMetrics = async (): Promise<KpiMetricDefinition[]> => {
    const { data, error } = await supabase
        .from('kpi_metric_definitions')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('[fetchKpiMetrics] error:', error);
        return [];
    }
    return (data || []) as KpiMetricDefinition[];
};

export const fetchActiveKpiMetrics = async (): Promise<KpiMetricDefinition[]> => {
    const { data, error } = await supabase
        .from('kpi_metric_definitions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('[fetchActiveKpiMetrics] error:', error);
        return [];
    }
    return (data || []) as KpiMetricDefinition[];
};

export const upsertKpiMetric = async (metric: Partial<KpiMetricDefinition>): Promise<boolean> => {
    const { error } = await supabase
        .from('kpi_metric_definitions')
        .upsert({
            ...metric,
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (error) {
        console.error('[upsertKpiMetric] error:', error);
        return false;
    }
    return true;
};

export const deleteKpiMetric = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('kpi_metric_definitions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[deleteKpiMetric] error:', error);
        return false;
    }
    return true;
};

export const updateKpiMetricsBatch = async (metrics: Partial<KpiMetricDefinition>[]): Promise<boolean> => {
    for (const metric of metrics) {
        const { error } = await supabase
            .from('kpi_metric_definitions')
            .update({
                label: metric.label,
                description: metric.description,
                salary_percent: metric.salary_percent,
                monthly_target: metric.monthly_target,
                is_active: metric.is_active,
                sort_order: metric.sort_order,
                icon: metric.icon,
                field_type: metric.field_type,
                updated_at: new Date().toISOString()
            })
            .eq('id', metric.id);

        if (error) {
            console.error('[updateKpiMetricsBatch] error:', error);
            return false;
        }
    }
    return true;
};

// =====================================================
// Per-user target overrides
// =====================================================

export const fetchUserTargets = async (userId: string): Promise<KpiUserTarget[]> => {
    const { data, error } = await supabase
        .from('kpi_user_targets')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('[fetchUserTargets] error:', error);
        return [];
    }
    return (data || []) as KpiUserTarget[];
};

export const upsertUserTarget = async (target: KpiUserTarget): Promise<boolean> => {
    const { error } = await supabase
        .from('kpi_user_targets')
        .upsert({
            user_id: target.user_id,
            metric_key: target.metric_key,
            monthly_target: target.monthly_target,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,metric_key' });

    if (error) {
        console.error('[upsertUserTarget] error:', error);
        return false;
    }
    return true;
};

// =====================================================
// KPI Salary Calculation
// =====================================================

/**
 * Get actual KPI values for a user in a given month.
 * Maps metric keys to their actual counts from various data sources.
 */
export const getMonthlyKpiActuals = async (
    userId: string,
    month: number,
    year: number
): Promise<Record<string, number>> => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // Format local date strings for daily activity queries
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    const actuals: Record<string, number> = {};

    // 1. Calls (answered, unique per deal)
    const { data: callsData } = await supabase
        .from('crm_activities')
        .select('deal_id')
        .eq('user_id', userId)
        .eq('type', 'call')
        .eq('call_result', 'answered')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    const uniqueCallDeals = new Set((callsData || []).map((c: any) => c.deal_id));
    actuals['calls'] = uniqueCallDeals.size;

    // 2. Self-sourced data (is_new_customer + SELF_FOUND)
    const { data: selfData } = await supabase
        .from('crm_deals')
        .select('id')
        .eq('owner_user_id', userId)
        .eq('source_category', 'SELF_FOUND')
        .eq('is_new_customer', true)
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    actuals['self_sourced'] = (selfData || []).length;

    // 3. Manual KPIs from telesales_daily_activities (aggregated over the month)
    const { data: dailyData } = await supabase
        .from('telesales_daily_activities')
        .select('fb_group_posts, fb_comments, fb_friends, fb_personal_posts, zalo_posts')
        .eq('user_id', userId)
        .gte('report_date', startDateStr)
        .lte('report_date', endDateStr);

    let fbGroupPosts = 0, fbComments = 0, fbFriends = 0, fbPersonalPosts = 0, zaloPosts = 0;
    for (const r of (dailyData || [])) {
        fbGroupPosts += (r as any).fb_group_posts || 0;
        fbComments += (r as any).fb_comments || 0;
        fbFriends += (r as any).fb_friends || 0;
        fbPersonalPosts += (r as any).fb_personal_posts || 0;
        zaloPosts += (r as any).zalo_posts || 0;
    }
    actuals['fb_group_posts'] = fbGroupPosts;
    actuals['fb_comments'] = fbComments;
    actuals['fb_friends'] = fbFriends;
    actuals['fb_personal_posts'] = fbPersonalPosts;
    actuals['zalo_posts'] = zaloPosts;

    // 4. Revenue (delivered orders)
    const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('telesales_user_id', userId)
        .eq('status', 'delivered')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    actuals['revenue'] = (ordersData || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

    // 5. New outlets (distinct customers with first order this month)
    // Count customers whose first ever order was created this month
    const { data: newOutlets } = await supabase.rpc('count_new_outlets', {
        p_user_id: userId,
        p_start: startStr,
        p_end: endStr
    }).maybeSingle();

    actuals['new_outlets'] = (newOutlets as any)?.count || 0;

    return actuals;
};

/**
 * Calculate KPI-based salary for a user in a month.
 * Formula: baseSalary × Σ(min(actual/target, 1) × salary_percent%)
 */
export const calculateKpiSalary = async (
    userId: string,
    month: number,
    year: number,
    baseSalary: number
): Promise<KpiSalaryResult> => {
    // 1. Get active metrics with salary weights
    const metrics = await fetchActiveKpiMetrics();

    // 2. Get user-specific target overrides from user_kpi_settings (existing payroll config)
    const { data: userKpiSettings } = await supabase
        .rpc('get_user_kpi_settings', { p_user_id: userId });
    const userTargetsJson: Record<string, number> = (userKpiSettings as any)?.kpi_targets || {};

    // Also check kpi_user_targets table as fallback
    const userTargets = await fetchUserTargets(userId);
    const userTargetMap = new Map(userTargets.map(t => [t.metric_key, t.monthly_target]));

    // 3. Get actual values
    const actuals = await getMonthlyKpiActuals(userId, month, year);

    // 4. Build salary line items
    const items: KpiSalaryLineItem[] = [];
    let totalKpiSalary = 0;
    let totalSalaryPercent = 0;

    for (const metric of metrics) {
        if (metric.salary_percent <= 0) continue;

        // Priority: user_kpi_settings.kpi_targets > kpi_user_targets > metric default
        const target = userTargetsJson[metric.key] || userTargetMap.get(metric.key) || metric.monthly_target;
        const actual = actuals[metric.key] || 0;

        const completion = target > 0 ? Math.min(actual / target, 1) : (actual > 0 ? 1 : 0);
        const salaryAmount = baseSalary * (metric.salary_percent / 100) * completion;

        items.push({
            key: metric.key,
            label: metric.label,
            target,
            actual,
            completionPercent: completion * 100,
            salaryPercent: metric.salary_percent,
            salaryAmount: Math.round(salaryAmount),
            field_type: metric.field_type
        });

        totalKpiSalary += Math.round(salaryAmount);
        totalSalaryPercent += metric.salary_percent;
    }

    return {
        baseSalary,
        items,
        totalKpiSalary,
        totalSalaryPercent
    };
};
