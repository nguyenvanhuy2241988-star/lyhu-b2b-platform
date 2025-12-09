import { Order } from "./ordersStore";
import { User, Region } from "./usersStore";
import { isOrderEligibleForCommission } from "./fraudFilters";

export interface LeaderboardRow {
    ctvId: string;
    ctvName: string;
    province: string;
    region: Region;
    sales: number;
    orders: number;
    commission: number;
    rank: number;
}

export interface MonthlyLeaderboard {
    year: number;
    month: number;
    overall: LeaderboardRow[];
    byRegion: Record<string, LeaderboardRow[]>;
}

export function getMonthlyCtvLeaderboard(params: {
    year: number;
    month: number;
    orders: Order[];
    users: User[];
}): MonthlyLeaderboard {
    const { year, month, orders, users } = params;

    // Filter orders for the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const eligibleOrders = orders.filter(o => {
        // Only LYHU_SHIP, delivered, eligible for commission
        if (o.source !== "CTV") return false;
        if (o.fulfillmentMode !== "LYHU_SHIP") return false;
        if (!isOrderEligibleForCommission(o)) return false;

        const orderDate = new Date(o.createdAt);
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
    });

    // Aggregate by CTV
    const ctvStatsMap: Record<string, {
        sales: number;
        orders: number;
        commission: number;
    }> = {};

    eligibleOrders.forEach(o => {
        if (!o.ctvId) return;
        if (!ctvStatsMap[o.ctvId]) {
            ctvStatsMap[o.ctvId] = { sales: 0, orders: 0, commission: 0 };
        }
        ctvStatsMap[o.ctvId].sales += o.totalAmount;
        ctvStatsMap[o.ctvId].orders += 1;
        ctvStatsMap[o.ctvId].commission += o.ctvCommission || 0;
    });

    // Build leaderboard rows
    const rows: LeaderboardRow[] = Object.entries(ctvStatsMap).map(([ctvId, stats]) => {
        const user = users.find(u => u.id === ctvId);
        return {
            ctvId,
            ctvName: user?.name || "Unknown CTV",
            province: user?.province || "Unknown",
            region: user?.region || "Other",
            sales: stats.sales,
            orders: stats.orders,
            commission: stats.commission,
            rank: 0,
        };
    });

    // Sort by sales descending
    rows.sort((a, b) => b.sales - a.sales);

    // Assign ranks
    rows.forEach((row, index) => {
        row.rank = index + 1;
    });

    // Group by region
    const byRegion: Record<string, LeaderboardRow[]> = {};
    rows.forEach(row => {
        if (!byRegion[row.region]) {
            byRegion[row.region] = [];
        }
        byRegion[row.region].push({ ...row });
    });

    // Re-rank within each region
    Object.values(byRegion).forEach(regionRows => {
        regionRows.sort((a, b) => b.sales - a.sales);
        regionRows.forEach((row, index) => {
            row.rank = index + 1;
        });
    });

    return {
        year,
        month,
        overall: rows,
        byRegion,
    };
}

export function getCtvRankInLeaderboard(
    leaderboard: MonthlyLeaderboard,
    ctvId: string
): { overallRank: number | null; regionRank: number | null; region: string | null; stats: LeaderboardRow | null } {
    const overallRow = leaderboard.overall.find(r => r.ctvId === ctvId);

    if (!overallRow) {
        return { overallRank: null, regionRank: null, region: null, stats: null };
    }

    const regionRows = leaderboard.byRegion[overallRow.region] || [];
    const regionRow = regionRows.find(r => r.ctvId === ctvId);

    return {
        overallRank: overallRow.rank,
        regionRank: regionRow?.rank || null,
        region: overallRow.region,
        stats: overallRow,
    };
}
