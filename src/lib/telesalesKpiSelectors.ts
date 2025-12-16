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

// --- KPI Targets & Status ---

export const KPI_TARGETS = {
    calls: 40,
    orders: 3,
    revenue: 3000000
};

export type KpiStatus = 'good' | 'warning' | 'bad';

export interface KpiProgress {
    status: KpiStatus;
    percentage: number;
}

export const calculateKpiProgress = (metrics: KpiMetrics): KpiProgress => {
    // Calculate simple average progress or weighted?
    // User suggested average of 3 indicators or reasonable method.
    // Let's cap individual progress to 100% to avoid skewed average? Or allow >100%?
    // "Warning: 50% - <100%". "Bad: <50%".

    const callProgress = Math.min(metrics.totalCalls / KPI_TARGETS.calls, 1.2); // Cap slightly > 1
    const orderProgress = Math.min(metrics.totalOrders / KPI_TARGETS.orders, 1.2);
    const revenueProgress = Math.min(metrics.totalRevenue / KPI_TARGETS.revenue, 1.2);

    // Weighted average? Or simple? 
    // Let's take simple average of percentages.
    const avgProgress = (callProgress + orderProgress + revenueProgress) / 3;
    const percentage = Math.round(avgProgress * 100);

    let status: KpiStatus = 'bad';
    if (percentage >= 100) status = 'good';
    else if (percentage >= 50) status = 'warning';

    return { status, percentage };
};

export const getWeeklyRanges = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat). We want Mon-Sun.
    const diffToMon = (dayOfWeek + 6) % 7; // Distance to Monday

    // This Week: Mon to Today
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - diffToMon);
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekEnd = new Date(); // Up to now
    thisWeekEnd.setHours(23, 59, 59, 999);

    // Last Week: Mon to Sun
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(thisWeekStart); // Mon of this week
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1); // Sunday of last week
    lastWeekEnd.setHours(23, 59, 59, 999);

    return {
        thisWeek: { from: thisWeekStart, to: thisWeekEnd },
        lastWeek: { from: lastWeekStart, to: lastWeekEnd }
    };
};

// --- Daily Targets & Remaining ---

export interface TelesalesKpiTarget {
    userId: string;
    callsPerDay: number;
    ordersPerDay: number;
    revenuePerDay: number;
}

export interface KpiRemaining {
    calls: number;
    orders: number;
    revenue: number;
    isCompleted: boolean;
}

// Mock function to get target (can be replaced with real store later)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getTodayTargetForCurrentUser = (userId: string = "current"): TelesalesKpiTarget => {
    // For now, return default hardcoded target
    return {
        userId,
        callsPerDay: KPI_TARGETS.calls,
        ordersPerDay: KPI_TARGETS.orders,
        revenuePerDay: KPI_TARGETS.revenue
    };
};

export const calculateKpiRemaining = (metrics: KpiMetrics, target: TelesalesKpiTarget): KpiRemaining => {
    const remainingCalls = Math.max(0, target.callsPerDay - metrics.totalCalls);
    const remainingOrders = Math.max(0, target.ordersPerDay - metrics.totalOrders);
    const remainingRevenue = Math.max(0, target.revenuePerDay - metrics.totalRevenue);

    const isCompleted = remainingCalls === 0 && remainingOrders === 0 && remainingRevenue === 0;

    return {
        calls: remainingCalls,
        orders: remainingOrders,
        revenue: remainingRevenue,
        isCompleted
    };
};

// --- Admin Selectors ---
import { loadUsers, getUserById } from "./usersStore";
import { ROLES } from "./constants";
import { loadTasks } from "./telesalesTasksStore";

export interface AdminTeleKpiRow extends KpiMetrics {
    userId: string;
    userName: string;
    targetCalls: number;
    targetOrders: number;
    targetRevenue: number;
    progressCalls: number;
    progressRevenue: number;
    overallProgress: number; // 0-100
}

export const getKpiSummaryByUser = (from: Date, to: Date): AdminTeleKpiRow[] => {
    // 1. Get all Telesales users
    const users = loadUsers().filter(u => u.role === ROLES.TELESALES);
    const allTasks = loadTasks();

    return users.map(user => {
        // 2. Filter tasks for this user
        const userTasks = allTasks.filter(t => t.telesalesUserId === user.id);

        // 3. Calc Metrics
        const metrics = calculateKpiMetrics(userTasks, from, to);

        // 4. Calc Targets (using mock target for now)
        const target = getTodayTargetForCurrentUser(user.id); // Re-using existing mock, maybe scale if range > 1 day?
        // Note: Target logic currently is "Per Day". For generic ranges, we might need to multiply by days?
        // For simplicity in this version, let's treat target as "Daily Average Target" or compare vs "Daily Target" just for reference?
        // Actually, request says "KPI progress". If range is "Month", target should be Monthly. 
        // Current `getTodayTargetForCurrentUser` returns DAILY target.
        // Let's approximate: 
        // Days in range = (to - from) / 86400000. 
        // Target = Daily * Days.

        const dayCount = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
        const totalTargetCalls = target.callsPerDay * dayCount;
        const totalTargetOrders = target.ordersPerDay * dayCount;
        const totalTargetRevenue = target.revenuePerDay * dayCount;

        const pCalls = totalTargetCalls > 0 ? (metrics.totalCalls / totalTargetCalls) * 100 : 0;
        const pRevenue = totalTargetRevenue > 0 ? (metrics.totalRevenue / totalTargetRevenue) * 100 : 0;

        // Simple blend for overall
        const overall = (pCalls + pRevenue) / 2;

        return {
            ...metrics,
            userId: user.id,
            userName: user.name,
            targetCalls: totalTargetCalls,
            targetOrders: totalTargetOrders,
            targetRevenue: totalTargetRevenue,
            progressCalls: pCalls,
            progressRevenue: pRevenue,
            overallProgress: overall
        };
    });
};

export const getGlobalKpiSummary = (from: Date, to: Date): KpiMetrics => {
    const allTasks = loadTasks();
    // Optional: Filter only tasks assigned to telesales? 
    // Yes, generally we only care about telesales tasks.
    // The store might contain tasks for others if expanded later, but now it's "telesalesTasksStore".
    // Safe to use all, or filter by users in TELESALES role if needed.
    // Let's filter by Telesales role to be safe if tasks allow other assignment.

    // Actually `telesalesTasksStore` naming implies it's specific. But let's check user roles just in case.
    const telesalesUserIds = new Set(loadUsers().filter(u => u.role === ROLES.TELESALES).map(u => u.id));
    const validTasks = allTasks.filter(t => telesalesUserIds.has(t.telesalesUserId));

    return calculateKpiMetrics(validTasks, from, to);
};
