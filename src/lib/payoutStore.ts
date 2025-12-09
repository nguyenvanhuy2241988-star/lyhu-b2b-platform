import { loadUsers } from "./usersStore";
import { loadOrders } from "./ordersStore";
import { getCurrentCycle } from "./payoutCycles";
import { getEligibleTotalForCycle } from "./payoutCycleEligibility";
import { ROLES } from "./constants";
import { recomputeWalletsFromSourceData } from "./walletStore";

export type PayoutStatus = "DRAFT" | "REQUESTED" | "APPROVED" | "REJECTED" | "PAID";

export interface PayoutRequest {
    id: string;
    ctvId: string;
    ctvName: string;
    createdAt: string;
    updatedAt: string;

    // amounts
    requestedAmount: number;
    approvedAmount?: number;

    // what this payout covers (legacy month-based)
    periodYear: number;
    periodMonth: number;

    // cycle-based (new)
    cycleKey?: string;
    cycleStartDate?: string;
    cycleEndDate?: string;

    // breakdown
    commissionFromOrders: number;
    commissionFromReferrals: number;
    totalEligibleAtRequestTime: number;

    status: PayoutStatus;
    adminNote?: string;

    // snapshot ids to lock payout scope
    coveredOrderIds: string[];
    coveredReferralChildIds?: string[];
}

const STORAGE_KEY = "lyhu_payout_requests";
const DRAFT_INDEX_KEY = "lyhu_payout_drafts_index";

export function loadPayouts(): PayoutRequest[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to load payouts:", error);
        return [];
    }
}

export function savePayouts(payouts: PayoutRequest[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payouts));
        window.dispatchEvent(new Event("payouts-updated"));
    } catch (error) {
        console.error("Failed to save payouts:", error);
    }
}

function loadDraftIndex(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        const stored = localStorage.getItem(DRAFT_INDEX_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function saveDraftIndex(index: Record<string, string>): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(index));
}

export function createPayoutRequest(params: {
    ctvId: string;
    ctvName: string;
    periodYear: number;
    periodMonth: number;
    requestedAmount: number;
    commissionFromOrders: number;
    commissionFromReferrals: number;
    totalEligibleAtRequestTime: number;
    coveredOrderIds: string[];
    coveredReferralChildIds?: string[];
    cycleKey?: string;
    cycleStartDate?: string;
    cycleEndDate?: string;
    status?: PayoutStatus;
}): PayoutRequest {
    const payouts = loadPayouts();
    const now = new Date().toISOString();

    const id = `PAY-${params.periodYear}-${String(params.periodMonth).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`;

    const newPayout: PayoutRequest = {
        id,
        ctvId: params.ctvId,
        ctvName: params.ctvName,
        createdAt: now,
        updatedAt: now,
        requestedAmount: params.requestedAmount,
        periodYear: params.periodYear,
        periodMonth: params.periodMonth,
        cycleKey: params.cycleKey,
        cycleStartDate: params.cycleStartDate,
        cycleEndDate: params.cycleEndDate,
        commissionFromOrders: params.commissionFromOrders,
        commissionFromReferrals: params.commissionFromReferrals,
        totalEligibleAtRequestTime: params.totalEligibleAtRequestTime,
        status: params.status || "REQUESTED",
        coveredOrderIds: params.coveredOrderIds,
        coveredReferralChildIds: params.coveredReferralChildIds,
    };

    payouts.unshift(newPayout);
    savePayouts(payouts);
    return newPayout;
}

export function approvePayoutRequest(id: string, approvedAmount?: number, note?: string): void {
    const payouts = loadPayouts();
    const updatedPayouts = payouts.map(p => {
        if (p.id === id && (p.status === "REQUESTED" || p.status === "DRAFT")) {
            return {
                ...p,
                status: "APPROVED" as PayoutStatus,
                approvedAmount: approvedAmount ?? p.requestedAmount,
                adminNote: note,
                updatedAt: new Date().toISOString(),
            };
        }
        return p;
    });
    savePayouts(updatedPayouts);
    recomputeWalletsFromSourceData();
}

export function rejectPayoutRequest(id: string, note?: string): void {
    const payouts = loadPayouts();
    const updatedPayouts = payouts.map(p => {
        if (p.id === id && (p.status === "REQUESTED" || p.status === "DRAFT")) {
            return {
                ...p,
                status: "REJECTED" as PayoutStatus,
                adminNote: note,
                updatedAt: new Date().toISOString(),
            };
        }
        return p;
    });
    savePayouts(updatedPayouts);
    recomputeWalletsFromSourceData();
}

export function confirmDraftToRequested(id: string): void {
    const payouts = loadPayouts();
    const updatedPayouts = payouts.map(p => {
        if (p.id === id && p.status === "DRAFT") {
            return {
                ...p,
                status: "REQUESTED" as PayoutStatus,
                updatedAt: new Date().toISOString(),
            };
        }
        return p;
    });
    savePayouts(updatedPayouts);
    recomputeWalletsFromSourceData();
}

export function markPaid(id: string, note?: string): void {
    const payouts = loadPayouts();
    const payout = payouts.find(p => p.id === id);

    if (!payout || payout.status !== "APPROVED") return;

    // Mark orders as paid
    const orders = JSON.parse(localStorage.getItem("lyhu_orders") || "[]");
    const updatedOrders = orders.map((o: any) => {
        if (payout.coveredOrderIds.includes(o.id)) {
            return {
                ...o,
                ctvPaidAt: new Date().toISOString(),
                ctvPayoutId: id,
            };
        }
        return o;
    });
    localStorage.setItem("lyhu_orders", JSON.stringify(updatedOrders));

    // Mark referral month as paid
    const referralPaidMap = JSON.parse(localStorage.getItem("lyhu_referral_paid_map") || "{}");
    const monthKey = `${payout.ctvId}-${payout.periodYear}-${payout.periodMonth}`;
    referralPaidMap[monthKey] = id;
    localStorage.setItem("lyhu_referral_paid_map", JSON.stringify(referralPaidMap));

    // Update payout status
    const updatedPayouts = payouts.map(p => {
        if (p.id === id) {
            return {
                ...p,
                status: "PAID" as PayoutStatus,
                adminNote: note ? (p.adminNote ? `${p.adminNote} | ${note}` : note) : p.adminNote,
                updatedAt: new Date().toISOString(),
            };
        }
        return p;
    });
    savePayouts(updatedPayouts);

    window.dispatchEvent(new Event("orders-updated"));
    recomputeWalletsFromSourceData();
}

export function getPayoutsByCtv(ctvId: string): PayoutRequest[] {
    const payouts = loadPayouts();
    return payouts.filter(p => p.ctvId === ctvId);
}

export function getPayoutById(id: string): PayoutRequest | undefined {
    const payouts = loadPayouts();
    return payouts.find(p => p.id === id);
}

export function hasPendingPayoutForMonth(ctvId: string, year: number, month: number): boolean {
    const payouts = loadPayouts();
    return payouts.some(p =>
        p.ctvId === ctvId &&
        p.periodYear === year &&
        p.periodMonth === month &&
        (p.status === "REQUESTED" || p.status === "APPROVED")
    );
}

export function getDraftForCycle(ctvId: string, cycleKey: string): PayoutRequest | undefined {
    const payouts = loadPayouts();
    return payouts.find(p =>
        p.ctvId === ctvId &&
        p.cycleKey === cycleKey &&
        p.status === "DRAFT"
    );
}

export function autoGeneratePayoutDraftsForCurrentCycle(): number {
    const cycle = getCurrentCycle();
    const users = loadUsers();
    const orders = loadOrders();
    const payouts = loadPayouts();
    const draftIndex = loadDraftIndex();

    const ctvUsers = users.filter(u => u.role === ROLES.CTV);
    let draftsCreated = 0;

    ctvUsers.forEach(ctv => {
        const indexKey = `${ctv.id}-${cycle.cycleKey}`;

        // Check if draft already exists
        const existingDraftId = draftIndex[indexKey];
        const existingDraft = existingDraftId
            ? payouts.find(p => p.id === existingDraftId && (p.status === "DRAFT" || p.status === "REQUESTED" || p.status === "APPROVED"))
            : null;

        // Calculate eligibility
        const eligibility = getEligibleTotalForCycle(
            ctv.id,
            cycle.startDate,
            cycle.endDate,
            cycle.cycleLetter
        );

        if (eligibility.totalEligible <= 0) return;

        if (existingDraft) {
            // Update existing draft if still DRAFT
            if (existingDraft.status === "DRAFT") {
                const updatedPayouts = payouts.map(p => {
                    if (p.id === existingDraft.id) {
                        return {
                            ...p,
                            requestedAmount: eligibility.totalEligible,
                            commissionFromOrders: eligibility.ordersCommission,
                            commissionFromReferrals: eligibility.referralCommission,
                            totalEligibleAtRequestTime: eligibility.totalEligible,
                            coveredOrderIds: eligibility.eligibleOrderIds,
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return p;
                });
                savePayouts(updatedPayouts);
            }
        } else {
            // Create new draft
            const newDraft = createPayoutRequest({
                ctvId: ctv.id,
                ctvName: ctv.name,
                periodYear: cycle.year,
                periodMonth: cycle.month,
                cycleKey: cycle.cycleKey,
                cycleStartDate: cycle.startDate,
                cycleEndDate: cycle.endDate,
                requestedAmount: eligibility.totalEligible,
                commissionFromOrders: eligibility.ordersCommission,
                commissionFromReferrals: eligibility.referralCommission,
                totalEligibleAtRequestTime: eligibility.totalEligible,
                coveredOrderIds: eligibility.eligibleOrderIds,
                status: "DRAFT",
            });

            draftIndex[indexKey] = newDraft.id;
            draftsCreated++;
        }
    });

    saveDraftIndex(draftIndex);
    recomputeWalletsFromSourceData();
    return draftsCreated;
}
