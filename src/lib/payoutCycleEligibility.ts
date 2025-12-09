import { Order, loadOrders } from "./ordersStore";
import { loadUsers } from "./usersStore";
import { getParentReferralSummary } from "./referralAnalytics";

// Get eligible orders for CTV within a date range (not yet paid)
export function getEligibleOrdersForCtvInRange(
    ctvId: string,
    startDate: string,
    endDate: string,
    orders: Order[]
): Order[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return orders.filter(o => {
        if (o.source !== "CTV") return false;
        if (o.ctvId !== ctvId) return false;
        if (o.status !== "delivered") return false;
        if (!o.ctvCommission || o.ctvCommission <= 0) return false;
        if (o.ctvPaidAt) return false; // Already paid

        const orderDate = new Date(o.createdAt);
        return orderDate >= start && orderDate <= end;
    });
}

// Get commission total from eligible orders
export function getEligibleOrderCommissionInRange(
    ctvId: string,
    startDate: string,
    endDate: string,
    orders: Order[]
): number {
    const eligibleOrders = getEligibleOrdersForCtvInRange(ctvId, startDate, endDate, orders);
    return eligibleOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0);
}

// Get referral earnings for cycle (simplified: include only for cycle B)
export function getEligibleReferralForCtvInCycle(
    ctvId: string,
    cycleLetter: "A" | "B"
): number {
    // For simplicity, only include referral earnings in Cycle B (end of month)
    if (cycleLetter === "A") {
        return 0;
    }

    // Check if referral already paid this month
    const referralPaidMap = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("lyhu_referral_paid_map") || "{}")
        : {};

    // Get current user's referral code
    const users = loadUsers();
    const ctv = users.find(u => u.id === ctvId);
    if (!ctv?.referralCode) return 0;

    // Check if already paid for this month via referral map
    const now = new Date();
    const monthKey = `${ctvId}-${now.getFullYear()}-${now.getMonth() + 1}`;
    if (referralPaidMap[monthKey]) {
        return 0;
    }

    // Get referral summary
    const summary = getParentReferralSummary(ctv.referralCode);
    return summary.totalReferralEarnings;
}

// Get total eligible for a cycle
export function getEligibleTotalForCycle(
    ctvId: string,
    startDate: string,
    endDate: string,
    cycleLetter: "A" | "B"
): {
    ordersCommission: number;
    referralCommission: number;
    totalEligible: number;
    eligibleOrderIds: string[];
} {
    const orders = loadOrders();
    const eligibleOrders = getEligibleOrdersForCtvInRange(ctvId, startDate, endDate, orders);
    const ordersCommission = eligibleOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0);
    const referralCommission = getEligibleReferralForCtvInCycle(ctvId, cycleLetter);

    return {
        ordersCommission,
        referralCommission,
        totalEligible: ordersCommission + referralCommission,
        eligibleOrderIds: eligibleOrders.map(o => o.id),
    };
}
