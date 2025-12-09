import { Order, loadOrders } from "./ordersStore";
import { loadUsers, User } from "./usersStore";
import { getParentReferralSummary } from "./referralAnalytics";

// Check if referral bonus for a month has been paid
export function isReferralPaidForMonth(ctvId: string, year: number, month: number): boolean {
    if (typeof window === "undefined") return false;
    const referralPaidMap = JSON.parse(localStorage.getItem("lyhu_referral_paid_map") || "{}");
    const monthKey = `${ctvId}-${year}-${month}`;
    return !!referralPaidMap[monthKey];
}

// Get eligible orders for a CTV in a specific month (not yet paid)
export function getEligibleOrdersForCtv(
    ctvId: string,
    year: number,
    month: number,
    orders: Order[]
): Order[] {
    return orders.filter(o => {
        if (o.source !== "CTV") return false;
        if (o.ctvId !== ctvId) return false;
        if (o.status !== "delivered") return false;
        if (!o.ctvCommission || o.ctvCommission <= 0) return false;
        if (o.ctvPaidAt) return false; // Already paid

        const orderDate = new Date(o.createdAt);
        if (orderDate.getMonth() !== month - 1) return false;
        if (orderDate.getFullYear() !== year) return false;

        return true;
    });
}

// Get total eligible order commission
export function getEligibleOrderCommissionTotal(
    ctvId: string,
    year: number,
    month: number,
    orders: Order[]
): number {
    const eligibleOrders = getEligibleOrdersForCtv(ctvId, year, month, orders);
    return eligibleOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0);
}

// Get eligible referral earnings for a month (if not already paid)
export function getEligibleReferralTotal(
    ctvId: string,
    year: number,
    month: number
): number {
    // Check if already paid
    if (isReferralPaidForMonth(ctvId, year, month)) {
        return 0;
    }

    // Get current user's referral code
    const users = loadUsers();
    const ctv = users.find(u => u.id === ctvId);
    if (!ctv?.referralCode) return 0;

    // Get referral summary
    const summary = getParentReferralSummary(ctv.referralCode);

    // For simplicity, we include all referral earnings if not paid for this month
    // In a more complex system, you'd track monthly referral earnings separately
    return summary.totalReferralEarnings;
}

// Get total eligible earnings for a month
export function getTotalEligibleForMonth(
    ctvId: string,
    year: number,
    month: number
): {
    commissionFromOrders: number;
    commissionFromReferrals: number;
    totalEligible: number;
    eligibleOrderIds: string[];
} {
    const orders = loadOrders();
    const eligibleOrders = getEligibleOrdersForCtv(ctvId, year, month, orders);
    const commissionFromOrders = eligibleOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0);
    const commissionFromReferrals = getEligibleReferralTotal(ctvId, year, month);

    return {
        commissionFromOrders,
        commissionFromReferrals,
        totalEligible: commissionFromOrders + commissionFromReferrals,
        eligibleOrderIds: eligibleOrders.map(o => o.id),
    };
}

// Get payout stats for a CTV in a month
export function getPayoutStatsForMonth(
    ctvId: string,
    year: number,
    month: number
): {
    eligibleAmount: number;
    requestedAmount: number;
    approvedAmount: number;
    paidAmount: number;
} {
    const payouts = JSON.parse(localStorage.getItem("lyhu_payout_requests") || "[]");

    const monthPayouts = payouts.filter((p: any) =>
        p.ctvId === ctvId &&
        p.periodYear === year &&
        p.periodMonth === month
    );

    const eligibility = getTotalEligibleForMonth(ctvId, year, month);

    return {
        eligibleAmount: eligibility.totalEligible,
        requestedAmount: monthPayouts
            .filter((p: any) => p.status === "REQUESTED")
            .reduce((sum: number, p: any) => sum + p.requestedAmount, 0),
        approvedAmount: monthPayouts
            .filter((p: any) => p.status === "APPROVED")
            .reduce((sum: number, p: any) => sum + (p.approvedAmount || p.requestedAmount), 0),
        paidAmount: monthPayouts
            .filter((p: any) => p.status === "PAID")
            .reduce((sum: number, p: any) => sum + (p.approvedAmount || p.requestedAmount), 0),
    };
}
