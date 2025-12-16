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
import { loadOrders } from "./ordersStore";

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
    const allTasks = loadTasks(); // Keep loading tasks for calls/talk time
    const allOrders = loadOrders(); // Load real orders

    return users.map(user => {
        // 2. Filter tasks & orders for this user
        const userTasks = allTasks.filter(t => t.telesalesUserId === user.id);
        const userOrders = allOrders.filter(o =>
            o.telesalesUserId === user.id &&
            o.source === "TELESALES" &&
            o.status !== "cancelled"
        );

        // 3. Calc Metrics
        // Base metrics from tasks (calls)
        const taskMetrics = calculateKpiMetrics(userTasks, from, to);

        // Enhance with real order data (Revenue, Orders, Commission)
        // Filter orders by date range
        const validOrders = userOrders.filter(o => {
            const d = new Date(o.createdAt);
            const start = new Date(from);
            start.setHours(0, 0, 0, 0);
            const end = new Date(to);
            end.setHours(23, 59, 59, 999);
            return d >= start && d <= end;
        });

        const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = validOrders.length;
        const totalCommission = totalRevenue * COMMISSION_RATE; // 2.5% of real revenue

        // Recalculate conversion rate: Orders / Calls (if calls > 0)
        // Use calls from task metrics.
        // Note: Task metrics might have its own "totalOrders" from task disposition "Order", 
        // but "Real Orders" from store is source of truth for Revenue.
        // Let's use Real Orders count.

        const conversionRate = taskMetrics.totalCalls > 0
            ? Math.round((totalOrders / taskMetrics.totalCalls) * 100)
            : 0;

        const metrics: KpiMetrics = {
            ...taskMetrics,
            totalOrders,
            totalRevenue,
            totalCommission,
            conversionRate
        };

        // 4. Calc Targets (using mock target for now)
        const target = getTodayTargetForCurrentUser(user.id);

        const dayCount = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
        const totalTargetCalls = target.callsPerDay * dayCount;
        const totalTargetOrders = target.ordersPerDay * dayCount;
        const totalTargetRevenue = target.revenuePerDay * dayCount;

        const pCalls = totalTargetCalls > 0 ? (metrics.totalCalls / totalTargetCalls) * 100 : 0;
        const pRevenue = totalTargetRevenue > 0 ? (metrics.totalRevenue / totalTargetRevenue) * 100 : 0;

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
    // Aggregate from individual summaries to ensure consistency
    const summaries = getKpiSummaryByUser(from, to);

    const totalCalls = summaries.reduce((acc, s) => acc + s.totalCalls, 0);
    const totalOrders = summaries.reduce((acc, s) => acc + s.totalOrders, 0);
    const totalRevenue = summaries.reduce((acc, s) => acc + s.totalRevenue, 0);
    const totalCommission = summaries.reduce((acc, s) => acc + s.totalCommission, 0);

    const conversionRate = totalCalls > 0 ? (totalOrders / totalCalls) * 100 : 0;

    return {
        totalCalls,
        totalOrders,
        totalRevenue,
        totalCommission,
        conversionRate
    };
};
