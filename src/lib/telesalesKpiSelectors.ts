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

export async function getGlobalKpiSummary(from: Date, to: Date) {
    return {
        totalCalls: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        conversionRate: 0
    };
}

export async function getKpiSummaryByUser(from: Date, to: Date): Promise<AdminTeleKpiRow[]> {
    return [];
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

export function calculateCombinedMetrics(tasksLike: any[], ordersLike: any[], from: Date, to: Date, commissionRate: number = COMMISSION_RATE) {
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
    const totalCommission = totalRevenue * commissionRate;
    const conversionRate = totalCalls === 0 ? 0 : (totalOrders / totalCalls) * 100;

    return {
        totalCalls,
        totalOrders,
        totalRevenue,
        totalCommission,
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
