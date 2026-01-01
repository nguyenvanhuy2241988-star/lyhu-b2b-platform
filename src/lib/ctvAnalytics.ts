import { Order, OrderStatus } from "./ordersStore";
import { loadUsers } from "./usersStore";

export interface CtvMonthlyStats {
    selfShipSales: number;
    lyhuShipSales: number;
    totalCommission: number;
    payableCommission: number;
    monthlyOrders: Order[];
}

export interface CtvPerformance {
    ctvId: string;
    ctvName: string;
    totalOrders: number;
    totalSales: number;
    totalCommission: number;
    payableCommission: number;
    selfShipSales: number;
    lyhuShipSales: number;
}

export function getCtvOrders(allOrders: Order[], ctvId: string): Order[] {
    return allOrders.filter(o => o.source === "CTV" && o.ctvId === ctvId);
}

export function getCtvMonthlySummary(orders: Order[], year: number, month: number): CtvMonthlyStats {
    // month is 1-12
    const monthlyOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === month - 1 && d.getFullYear() === year;
    });

    const selfShipSales = monthlyOrders
        .filter(o => o.fulfillmentMode === "SELF_SHIP" && o.status !== "cancelled")
        .reduce((sum, o) => sum + o.totalAmount, 0);

    const lyhuShipSales = monthlyOrders
        .filter(o => o.fulfillmentMode === "LYHU_SHIP" && o.status !== "cancelled")
        .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalCommission = monthlyOrders
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.ctvCommission || 0), 0);

    const payableCommission = monthlyOrders
        .filter(o => o.status === "delivered")
        .reduce((sum, o) => sum + (o.ctvCommission || 0), 0);

    return {
        selfShipSales,
        lyhuShipSales,
        totalCommission,
        payableCommission,
        monthlyOrders
    };
}

export function getAdminCtvLeaderboard(allOrders: Order[]): CtvPerformance[] {
    const users = loadUsers();
    const userMap = new Map(users.map(u => [u.id, u]));
    const ctvMap = new Map<string, CtvPerformance>();

    allOrders.filter(o => o.source === "CTV").forEach(order => {
        if (!order.ctvId) return;

        const existing = ctvMap.get(order.ctvId) || {
            ctvId: order.ctvId,
            ctvName: userMap.get(order.ctvId)?.name || "Unknown CTV",
            totalOrders: 0,
            totalSales: 0,
            totalCommission: 0,
            payableCommission: 0,
            selfShipSales: 0,
            lyhuShipSales: 0,
        };

        if (order.status !== "cancelled") {
            existing.totalOrders += 1;
            existing.totalSales += order.totalAmount;
            existing.totalCommission += (order.ctvCommission || 0);

            if (order.status === "delivered") {
                existing.payableCommission += (order.ctvCommission || 0);
            }

            if (order.fulfillmentMode === "SELF_SHIP") {
                existing.selfShipSales += order.totalAmount;
            } else if (order.fulfillmentMode === "LYHU_SHIP") {
                existing.lyhuShipSales += order.totalAmount;
            }
        }

        ctvMap.set(order.ctvId, existing);
    });

    return Array.from(ctvMap.values()).sort((a, b) => b.totalSales - a.totalSales);
}
