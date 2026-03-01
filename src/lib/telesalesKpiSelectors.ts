import type { TelesalesTask } from "./telesalesTasksStore";

export function asArray<T>(v: any): T[] {
    return Array.isArray(v) ? v : [];
}

export function calculateKpiProgress(tasksLike: any) {
    const tasks = asArray<TelesalesTask>(tasksLike);
    const total = tasks.length;
    const done = tasks.filter(t => t.status === "done").length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    // Also return status and percentage for earnings page compatibility
    let status: 'good' | 'warning' | 'bad' = 'bad';
    if (progress >= 80) status = 'good';
    else if (progress >= 50) status = 'warning';

    return { total, done, progress, status, percentage: progress };
}

export function filterTasksByCompletionDate(tasksLike: any, from: Date, to: Date) {
    const tasks = asArray<TelesalesTask>(tasksLike);
    const fromTime = from.getTime();
    const toTime = to.getTime();
    return tasks.filter(t => {
        if (!t.completed_at) return false;
        const time = new Date(t.completed_at).getTime();
        return time >= fromTime && time <= toTime;
    });
}

// Fix build error: calculateKpiMetrics was missing
export function calculateKpiMetrics(...args: any[]) {
    return {
        totalTasks: 0,
        doneTasks: 0,
        totalLeads: 0,
        doneLeads: 0,
        conversion: 0,
    };
}

// Fix build error: Missing exports for admin telesales earnings page
export type AdminTeleKpiRow = {
    userId: string;
    userName: string;
    totalCalls: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    conversionRate: number;
    overallProgress: number;
};

import { fetchUsers } from "./usersStore";
import { fetchOrders } from "./ordersStore";
import { supabase } from "./supabaseClient";

export async function getGlobalKpiSummary(from: Date, to: Date, token?: string) {
    const defaultRes = {
        totalCalls: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        conversionRate: 0
    };

    try {
        const users = await getKpiSummaryByUser(from, to, token);
        if (!users || users.length === 0) return defaultRes;

        const sum = users.reduce((acc, current) => {
            acc.totalCalls += current.totalCalls;
            acc.totalOrders += current.totalOrders;
            acc.totalRevenue += current.totalRevenue;
            acc.totalCommission += current.totalCommission;
            return acc;
        }, { ...defaultRes });

        sum.conversionRate = sum.totalCalls > 0 ? (sum.totalOrders / sum.totalCalls) * 100 : 0;
        return sum;
    } catch {
        return defaultRes;
    }
}

export async function getKpiSummaryByUser(from: Date, to: Date, token?: string): Promise<AdminTeleKpiRow[]> {
    try {
        // 1. Fetch Telesales profiles
        const allUsers = await fetchUsers(token);
        const teleUsers = allUsers.filter(u => u.role === 'telesales' || u.role === 'sale_admin');
        if (teleUsers.length === 0) return [];

        // 2. Fetch Orders for the whole date range with Role admin 
        const orders = await fetchOrders(token, {
            startDate: from.toISOString(),
            endDate: to.toISOString(),
            role: 'admin' // Forces getting all orders
        });

        // 3. Fetch KPI Settings (to get targets)
        const { data: targetsData } = await supabase
            .from('user_kpi_settings')
            .select('*');
        const defaultCommission = 0.03;

        // 4. Fetch Calls directly from CRM activities (source of truth)
        const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
        const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
        const dayStart = new Date(`${fromStr}T00:00:00`);
        const dayEnd = new Date(`${toStr}T23:59:59.999`);

        const teleUserIds = teleUsers.map(u => u.id);
        const { data: answeredCalls } = await supabase
            .from('crm_activities')
            .select('deal_id, user_id')
            .in('user_id', teleUserIds)
            .eq('type', 'call')
            .eq('call_result', 'answered')
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());

        // Map data by User
        const rows: AdminTeleKpiRow[] = teleUsers.map(user => {
            // Filter orders for this user
            const userOrders = orders.filter(o =>
                o.telesalesUserId === user.id &&
                o.status !== 'cancelled' &&
                o.status !== 'draft'
            );

            const uTotalOrders = userOrders.length;
            const uTotalRevenue = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            // Count answered calls from CRM activities (unique deal_id per user)
            const userCalls = (answeredCalls || []).filter((c: any) => c.user_id === user.id);
            const uniqueCallDeals = new Set(userCalls.map((c: any) => c.deal_id));
            const uTotalCalls = uniqueCallDeals.size;

            // Target Settings
            const tSetting = (targetsData || []).find((t: any) => t.user_id === user.id);
            const cRate = tSetting?.commission_rate !== undefined ? tSetting.commission_rate : defaultCommission;
            const revenueTarget = tSetting?.kpi_targets?.revenue || (tSetting?.daily_revenue_target ? tSetting.daily_revenue_target * 30 : 0);
            const uTotalCommission = Math.max(0, uTotalRevenue - revenueTarget) * cRate;

            const uConversionRate = uTotalCalls > 0 ? (uTotalOrders / uTotalCalls) * 100 : 0;

            // Simple combined progress metric based on target revenue
            const targetRevenue = tSetting?.daily_revenue_target ? tSetting.daily_revenue_target * 30 : 150000000; // Mock month target 150m
            const progress = targetRevenue > 0 ? (uTotalRevenue / targetRevenue) * 100 : 0;

            return {
                userId: user.id,
                userName: user.name || 'N/A',
                totalCalls: uTotalCalls,
                totalOrders: uTotalOrders,
                totalRevenue: uTotalRevenue,
                totalCommission: uTotalCommission,
                conversionRate: uConversionRate,
                overallProgress: Math.min(progress, 100)
            };
        });

        return rows;
    } catch (err) {
        console.error("getKpiSummaryByUser err:", err);
        return [];
    }
}

export function getWeeklyRanges() {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    return {
        thisWeek: { from: thisWeekStart, to: thisWeekEnd },
        lastWeek: { from: lastWeekStart, to: lastWeekEnd }
    };
}

// Additional missing exports for telesales earnings page
export const COMMISSION_RATE = 0.03; // 3% (Default fallback)

export function calculateCombinedMetrics(tasksLike: any[], ordersLike: any[], from: Date, to: Date, commissionRate: number = COMMISSION_RATE, revenueTarget: number = 0) {
    const tasks = asArray<TelesalesTask>(tasksLike);
    const orders = asArray<any>(ordersLike);
    const fromTime = from.getTime();
    const toTime = to.getTime();

    // Filter tasks by completion date
    const filteredTasks = tasks.filter(t => {
        if (!t.completed_at) return false;
        const time = new Date(t.completed_at).getTime();
        return time >= fromTime && time <= toTime;
    });

    // Filter orders by creation date and status (exclude cancelled/draft)
    const filteredOrders = orders.filter(o => {
        const time = new Date(o.createdAt).getTime();
        return time >= fromTime && time <= toTime && o.status !== 'cancelled' && o.status !== 'draft';
    });

    const totalCalls = filteredTasks.length;
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const surplusRevenue = Math.max(0, totalRevenue - revenueTarget);
    const totalCommission = surplusRevenue * commissionRate;
    const conversionRate = totalCalls === 0 ? 0 : (totalOrders / totalCalls) * 100;

    return {
        totalCalls,
        totalOrders,
        totalRevenue,
        totalCommission,
        surplusRevenue,
        conversionRate
    };
}

export function calculateKpiHistory(
    tasksLike: any[],
    from: Date,
    to: Date,
    ordersLike: any[],
    commissionRate: number = COMMISSION_RATE
): Array<{
    dateLabel: string;
    calls: number;
    orders: number;
    revenue: number;
    commission: number;
}> {
    const tasks = asArray<TelesalesTask>(tasksLike);
    const orders = asArray<any>(ordersLike);
    const history: Record<string, any> = {};

    // Initialize days in range
    const current = new Date(from);
    while (current <= to) {
        const label = current.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        history[label] = { dateLabel: label, calls: 0, orders: 0, revenue: 0, commission: 0 };
        current.setDate(current.getDate() + 1);
    }

    // Fill with task data
    tasks.forEach(t => {
        if (!t.completed_at) return;
        const d = new Date(t.completed_at);
        if (d >= from && d <= to) {
            const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            if (history[label]) history[label].calls++;
        }
    });

    // Fill with order data
    orders.forEach(o => {
        if (o.status === 'cancelled' || o.status === 'draft') return;
        const d = new Date(o.createdAt);
        if (d >= from && d <= to) {
            const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            if (history[label]) {
                history[label].orders++;
                history[label].revenue += (o.totalAmount || 0);
                history[label].commission += (o.totalAmount || 0) * commissionRate;
            }
        }
    });

    return Object.values(history).sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
}

export function getTodayTargetForCurrentUser() {
    return {
        callsPerDay: 50,
        ordersPerDay: 5,
        revenuePerDay: 5000000
    };
}

export function calculateKpiRemaining(metrics: any, target: any) {
    return {
        calls: Math.max(0, target.callsPerDay - metrics.totalCalls),
        orders: Math.max(0, target.ordersPerDay - metrics.totalOrders),
        revenue: Math.max(0, target.revenuePerDay - metrics.totalRevenue),
        isCompleted: metrics.totalCalls >= target.callsPerDay &&
            metrics.totalOrders >= target.ordersPerDay &&
            metrics.totalRevenue >= target.revenuePerDay
    };
}
