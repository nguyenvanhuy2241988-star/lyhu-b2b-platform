import { loadOrders, Order } from "./ordersStore";
import { loadUsers, User } from "./usersStore";
import { loadPayouts, PayoutRequest } from "./payoutStore";
import { getParentReferralSummary } from "./referralAnalytics";
import { ROLES } from "./constants";

export interface CtvWallet {
    ctvId: string;
    ctvName: string;
    updatedAt: string;

    // Running totals (all time)
    totalEarned: number;   // orders + referrals earned (based on eligible delivered)
    totalPaid: number;     // sum of PAID payout approvedAmount
    balance: number;       // totalEarned - totalPaid

    // Convenience
    pendingPayoutAmount: number; // sum of DRAFT + REQUESTED + APPROVED (not PAID)
}

const STORAGE_KEY = "lyhu_ctv_wallets";

export function loadWallets(): CtvWallet[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to load wallets:", error);
        return [];
    }
}

export function saveWallets(wallets: CtvWallet[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
        window.dispatchEvent(new Event("wallets-updated"));
    } catch (error) {
        console.error("Failed to save wallets:", error);
    }
}

export function getWalletByCtv(ctvId: string): CtvWallet | null {
    const wallets = loadWallets();
    return wallets.find(w => w.ctvId === ctvId) || null;
}

export function recomputeWalletsFromSourceData(): void {
    const users = loadUsers();
    const orders = loadOrders();
    const payouts = loadPayouts();

    const ctvUsers = users.filter(u => u.role === ROLES.CTV);
    const wallets: CtvWallet[] = [];

    ctvUsers.forEach(ctv => {
        // Calculate order earnings (delivered, with commission)
        const ctvOrders = orders.filter(o =>
            o.source === "CTV" &&
            o.ctvId === ctv.id &&
            o.status === "delivered" &&
            o.ctvCommission && o.ctvCommission > 0
        );
        const orderEarnings = ctvOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0);

        // Calculate referral earnings
        let referralEarnings = 0;
        if (ctv.referralCode) {
            const summary = getParentReferralSummary(ctv.referralCode);
            referralEarnings = summary.totalReferralEarnings;
        }

        const totalEarned = orderEarnings + referralEarnings;

        // Calculate total paid from PAID payouts
        const ctvPayouts = payouts.filter(p => p.ctvId === ctv.id);
        const totalPaid = ctvPayouts
            .filter(p => p.status === "PAID")
            .reduce((sum, p) => sum + (p.approvedAmount || p.requestedAmount), 0);

        // Calculate pending (DRAFT + REQUESTED + APPROVED)
        const pendingPayoutAmount = ctvPayouts
            .filter(p => p.status === "DRAFT" || p.status === "REQUESTED" || p.status === "APPROVED")
            .reduce((sum, p) => sum + (p.approvedAmount || p.requestedAmount), 0);

        wallets.push({
            ctvId: ctv.id,
            ctvName: ctv.name,
            updatedAt: new Date().toISOString(),
            totalEarned,
            totalPaid,
            balance: totalEarned - totalPaid,
            pendingPayoutAmount,
        });
    });

    saveWallets(wallets);
}
