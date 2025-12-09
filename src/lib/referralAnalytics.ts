import { Order } from "./ordersStore";
import { User, loadUsers, getChildCtvs, updateUserActivation } from "./usersStore";
import { ACTIVATION_BONUS, OVERRIDE_RATE, OVERRIDE_DURATION_DAYS } from "./referralRules";
import { isValidActivationOrder, MIN_ACTIVATION_ORDER_AMOUNT } from "./antiFraudRules";

export interface ChildCtvStats {
    id: string;
    name: string;
    referralCode: string;
    activatedAt: string | null;
    isActivated: boolean;
    childSales: number;
    childCommission: number;
    overrideEarnedForParent: number;
    activationOrderAmount?: number;
}

export interface ReferralSummary {
    totalChildren: number;
    activatedChildren: number;
    activationBonusTotal: number;
    overrideBonusTotal: number;
    totalReferralEarnings: number;
    children: ChildCtvStats[];
}

// Updated: Anti-fraud activation requires LYHU_SHIP + min amount
export function getChildActivationStatus(childId: string, orders: Order[]): {
    isActivated: boolean;
    activatedAt: string | null;
    activationOrderAmount?: number;
} {
    // A child CTV is "activated" when they have at least 1 qualifying order
    const qualifyingOrders = orders.filter(o => isValidActivationOrder(o) && o.ctvId === childId);

    if (qualifyingOrders.length > 0) {
        // Find the earliest qualifying order
        const sortedOrders = qualifyingOrders.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return {
            isActivated: true,
            activatedAt: sortedOrders[0].createdAt,
            activationOrderAmount: sortedOrders[0].totalAmount,
        };
    }

    return { isActivated: false, activatedAt: null };
}

export function checkAndUpdateActivation(childId: string, orders: Order[]): void {
    const { isActivated, activatedAt } = getChildActivationStatus(childId, orders);
    if (isActivated && activatedAt) {
        updateUserActivation(childId, activatedAt);
    }
}

export function computeActivationBonus(parentReferralCode: string, users: User[], orders: Order[]): number {
    const children = users.filter(u => u.referredByCode === parentReferralCode);
    let activatedCount = 0;

    children.forEach(child => {
        const { isActivated } = getChildActivationStatus(child.id, orders);
        if (isActivated) {
            activatedCount++;
        }
    });

    return activatedCount * ACTIVATION_BONUS;
}

export function computeOverrideBonus(parentReferralCode: string, users: User[], orders: Order[]): number {
    const children = users.filter(u => u.referredByCode === parentReferralCode);
    let totalOverride = 0;

    children.forEach(child => {
        const { isActivated, activatedAt } = getChildActivationStatus(child.id, orders);

        if (!isActivated || !activatedAt) return;

        const activationDate = new Date(activatedAt);
        const overrideEndDate = new Date(activationDate);
        overrideEndDate.setDate(overrideEndDate.getDate() + OVERRIDE_DURATION_DAYS);

        // Only count LYHU_SHIP delivered orders for override
        const childOrders = orders.filter(o =>
            o.source === "CTV" &&
            o.ctvId === child.id &&
            o.status === "delivered" &&
            o.fulfillmentMode === "LYHU_SHIP" &&
            new Date(o.createdAt) <= overrideEndDate
        );

        const childCommission = childOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0);
        totalOverride += childCommission * OVERRIDE_RATE;
    });

    return totalOverride;
}

export function getParentReferralSummary(parentReferralCode: string): ReferralSummary {
    const users = loadUsers();
    const orders = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("lyhu_orders") || "[]") as Order[]
        : [];

    const children = users.filter(u => u.referredByCode === parentReferralCode);

    const childrenStats: ChildCtvStats[] = children.map(child => {
        const { isActivated, activatedAt, activationOrderAmount } = getChildActivationStatus(child.id, orders);

        // Calculate child's total sales and commission (LYHU_SHIP only for override-eligible)
        const childOrders = orders.filter(o =>
            o.source === "CTV" && o.ctvId === child.id && o.status !== "cancelled"
        );
        const childSales = childOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const childCommission = childOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0);

        // Calculate override earned for parent from this child
        let overrideEarnedForParent = 0;
        if (isActivated && activatedAt) {
            const activationDate = new Date(activatedAt);
            const overrideEndDate = new Date(activationDate);
            overrideEndDate.setDate(overrideEndDate.getDate() + OVERRIDE_DURATION_DAYS);

            const eligibleOrders = orders.filter(o =>
                o.source === "CTV" &&
                o.ctvId === child.id &&
                o.status === "delivered" &&
                o.fulfillmentMode === "LYHU_SHIP" &&
                new Date(o.createdAt) <= overrideEndDate
            );

            const eligibleCommission = eligibleOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0);
            overrideEarnedForParent = eligibleCommission * OVERRIDE_RATE;
        }

        return {
            id: child.id,
            name: child.name,
            referralCode: child.referralCode || "",
            activatedAt: activatedAt,
            isActivated,
            childSales,
            childCommission,
            overrideEarnedForParent,
            activationOrderAmount,
        };
    });

    const activatedChildren = childrenStats.filter(c => c.isActivated).length;
    const activationBonusTotal = activatedChildren * ACTIVATION_BONUS;
    const overrideBonusTotal = childrenStats.reduce((sum, c) => sum + c.overrideEarnedForParent, 0);

    return {
        totalChildren: children.length,
        activatedChildren,
        activationBonusTotal,
        overrideBonusTotal,
        totalReferralEarnings: activationBonusTotal + overrideBonusTotal,
        children: childrenStats,
    };
}
