import { TelesalesTask, CallLog } from "./telesalesTasksStore";

export const COMMISSION_RATE = 0.025; // 2.5%

export interface KpiSummary {
    totalCalls: number;
    totalOrders: number; // Won deals
    totalRevenue: number;
    totalCommission: number;
    conversionRate: number;
}

export interface KpiHistoryRow {
    dateLabel: string; // "2024-12-15" or "Tuần 50"
    timestamp: number; // For sorting
    calls: number;
    orders: number;
    revenue: number;
    commission: number;
}

// Helpers
const startOfDay = (d: Date) => {
    const newDate = new Date(d);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
};

const getWeekNumber = (d: Date) => {
    const onejan = new Date(d.getFullYear(), 0, 1);
    const millis = d.getTime() - onejan.getTime();
    return Math.ceil(((millis / 86400000) + onejan.getDay() + 1) / 7);
};

export const filterTasksByDate = (
    tasks: TelesalesTask[],
    from: Date,
    to: Date
): TelesalesTask[] => {
    const fromTime = startOfDay(from).getTime();
    const toTime = new Date(to);
    toTime.setHours(23, 59, 59, 999);

    return tasks.filter(t => {
        // For Orders/Revenue: check completedAt (if done) OR updatedAt
        // Ideally we use completedAt for "Won" tasks.
        if (t.status === 'done' && t.completedAt) {
            const completedTime = new Date(t.completedAt).getTime();
            return completedTime >= fromTime && completedTime <= toTime.getTime();
        }
        return false;
    });
};

export const filterLogsByDate = (
    tasks: TelesalesTask[],
    from: Date,
    to: Date
): CallLog[] => {
    const fromTime = startOfDay(from).getTime();
    const toTime = new Date(to);
    toTime.setHours(23, 59, 59, 999);

    return tasks.flatMap(t => t.logs || []).filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime >= fromTime && logTime <= toTime.getTime();
    });
};

export const calculateKpiSummary = (
    tasks: TelesalesTask[],
    from: Date,
    to: Date
): KpiSummary => {
    // 1. Calls: Based on Logs timestamp
    const logsInRange = filterLogsByDate(tasks, from, to);
    const totalCalls = logsInRange.length;

    // 2. Orders/Revenue: Based on Task completion time
    const wonTasksInRange = filterTasksByDate(tasks, from, to).filter(t => t.status === 'done' && (t.orderAmount || 0) > 0);

    const totalOrders = wonTasksInRange.length;
    const totalRevenue = wonTasksInRange.reduce((sum, t) => sum + (t.orderAmount || 0), 0);
    const totalCommission = totalRevenue * COMMISSION_RATE;
    const conversionRate = totalCalls > 0 ? (totalOrders / totalCalls) * 100 : 0;

    return {
        totalCalls,
        totalOrders,
        totalRevenue,
        totalCommission,
        conversionRate
    };
};

export const calculateKpiHistory = (
    tasks: TelesalesTask[],
    viewMode: 'day' | 'week',
    daysCount: number = 30 // Look back N days
): KpiHistoryRow[] => {
    const now = new Date();
    const rows: Record<string, KpiHistoryRow> = {};

    // Determine range
    // We want to show history even if 0, but simplicity: just aggregate existing data?
    // User requested: "Sort descending by latest date".
    // Let's iterate back from today.

    for (let i = 0; i < daysCount; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayKey = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;

        const key = viewMode === 'day' ? dayKey : weekKey;
        const label = viewMode === 'day' ? d.toLocaleDateString('vi-VN') : `Tuần ${getWeekNumber(d)}`;

        if (!rows[key]) {
            rows[key] = {
                dateLabel: label,
                timestamp: viewMode === 'day' ? startOfDay(d).getTime() : startOfDay(d).getTime(), // Approximation for week sort
                calls: 0,
                orders: 0,
                revenue: 0,
                commission: 0
            };
        }
    }

    // Aggregate Logs (Calls)
    tasks.forEach(t => {
        (t.logs || []).forEach(log => {
            const d = new Date(log.timestamp);
            // Check if within range (roughly)
            const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
            if (diff > daysCount) return;

            const dayKey = d.toLocaleDateString('en-CA');
            const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;
            const key = viewMode === 'day' ? dayKey : weekKey;

            if (rows[key]) {
                rows[key].calls += 1;
            }
        });
    });

    // Aggregate Orders (Revenue)
    tasks.forEach(t => {
        if (t.status === 'done' && t.completedAt && (t.orderAmount || 0) > 0) {
            const d = new Date(t.completedAt);
            const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
            if (diff > daysCount) return;

            const dayKey = d.toLocaleDateString('en-CA');
            const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;
            const key = viewMode === 'day' ? dayKey : weekKey;

            if (rows[key]) {
                rows[key].orders += 1;
                rows[key].revenue += (t.orderAmount || 0);
            }
        }
    });

    // Calculate commission
    Object.values(rows).forEach(r => {
        r.commission = r.revenue * COMMISSION_RATE;
    });

    return Object.values(rows).sort((a, b) => b.timestamp - a.timestamp);
};
