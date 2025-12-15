import { TelesalesTask } from "./telesalesTasksStore";

export const COMMISSION_RATE = 0.025; // 2.5%

export interface KpiMetrics {
    totalCalls: number; // Proxy: Tasks with completedAt in range
    totalOrders: number; // Won deals
    totalRevenue: number;
    totalCommission: number;
    conversionRate: number;
}

export interface KpiHistoryRow {
    dateLabel: string; // YYYY-MM-DD
    timestamp: number;
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

// Filter tasks that "completed" within the range
export const filterTasksByCompletionDate = (
    tasks: TelesalesTask[],
    from: Date,
    to: Date
): TelesalesTask[] => {
    const fromTime = startOfDay(from).getTime();
    const toTime = new Date(to);
    toTime.setHours(23, 59, 59, 999);

    return tasks.filter(t => {
        // We use completedAt as the primary timestamp for KPI
        if (t.completedAt) {
            const completedTime = new Date(t.completedAt).getTime();
            return completedTime >= fromTime && completedTime <= toTime.getTime();
        }
        return false;
    });
};

export const calculateKpiMetrics = (
    tasks: TelesalesTask[],
    from: Date,
    to: Date
): KpiMetrics => {
    const completedTasksInRange = filterTasksByCompletionDate(tasks, from, to);

    // 1. Calls (Proxy): Total tasks processed (completedAt in range)
    const totalCalls = completedTasksInRange.length;

    // 2. Won Deals: completedAt in range AND orderAmount > 0 (and status done)
    const wonTasks = completedTasksInRange.filter(t =>
        (t.status === 'done' || t.status === 'Hoàn tất') && (t.orderAmount || 0) > 0
    );

    const totalOrders = wonTasks.length;

    // 3. Revenue
    const totalRevenue = wonTasks.reduce((sum, t) => sum + (t.orderAmount || 0), 0);

    // 4. Commission
    const totalCommission = totalRevenue * COMMISSION_RATE;

    // 5. Conversion Rate
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
    from: Date,
    to: Date
): KpiHistoryRow[] => {
    // Generate all days in range (descending order)
    const rows: KpiHistoryRow[] = [];
    const currentDate = new Date(to);
    const startDate = startOfDay(from);

    while (currentDate >= startDate) {
        const startOfDayTime = startOfDay(currentDate);
        const endOfDayTime = new Date(startOfDayTime);
        endOfDayTime.setHours(23, 59, 59, 999);

        const dailymetrics = calculateKpiMetrics(tasks, startOfDayTime, endOfDayTime);

        // Only add if there is data? or always? 
        // User: "nếu ngày nào không có data thì bỏ qua".
        if (dailymetrics.totalCalls > 0 || dailymetrics.totalRevenue > 0) {
            rows.push({
                dateLabel: currentDate.toLocaleDateString('vi-VN'), // Display format
                timestamp: startOfDayTime.getTime(),
                calls: dailymetrics.totalCalls,
                orders: dailymetrics.totalOrders,
                revenue: dailymetrics.totalRevenue,
                commission: dailymetrics.totalCommission
            });
        }

        currentDate.setDate(currentDate.getDate() - 1);
    }

    // Already sorted desc by loop structure
    return rows;
};
