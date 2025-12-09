import { Order, FraudStatus } from "./ordersStore";

// Check if order is eligible for CTV commission payout
export function isOrderEligibleForCommission(order: Order): boolean {
    if (order.source !== "CTV") return false;
    if (order.status !== "delivered") return false;
    if (!order.ctvCommission || order.ctvCommission <= 0) return false;

    // Exclude flagged orders unless cleared
    const fraudStatus = order.fraudStatus || "NONE";
    if (fraudStatus === "FLAGGED" || fraudStatus === "CONFIRMED") {
        return false;
    }

    return true;
}

// Check if order qualifies for CTV activation
export function isOrderEligibleForActivation(order: Order, minAmount?: number): boolean {
    if (order.source !== "CTV") return false;
    if (order.fulfillmentMode !== "LYHU_SHIP") return false;
    if (order.status !== "delivered") return false;

    // Exclude flagged orders
    const fraudStatus = order.fraudStatus || "NONE";
    if (fraudStatus === "FLAGGED" || fraudStatus === "CONFIRMED") {
        return false;
    }

    // Check minimum amount if specified
    if (minAmount && order.totalAmount < minAmount) {
        return false;
    }

    return true;
}

// Check if order qualifies for parent override bonus
export function isOrderEligibleForOverride(order: Order): boolean {
    if (order.source !== "CTV") return false;
    if (order.fulfillmentMode !== "LYHU_SHIP") return false;
    if (order.status !== "delivered") return false;

    // Exclude flagged orders unless cleared
    const fraudStatus = order.fraudStatus || "NONE";
    if (fraudStatus === "FLAGGED" || fraudStatus === "CONFIRMED") {
        return false;
    }

    return true;
}

// Check if order is eligible for payout
export function isOrderEligibleForPayout(order: Order): boolean {
    if (order.source !== "CTV") return false;
    if (order.status !== "delivered") return false;
    if (!order.ctvCommission || order.ctvCommission <= 0) return false;
    if (order.ctvPaidAt) return false; // Already paid

    // Exclude flagged orders unless cleared
    const fraudStatus = order.fraudStatus || "NONE";
    if (fraudStatus === "FLAGGED" || fraudStatus === "CONFIRMED") {
        return false;
    }

    return true;
}

// Get all eligible orders for commission calculation
export function getEligibleOrdersForCommission(orders: Order[], ctvId?: string): Order[] {
    return orders.filter(o => {
        if (ctvId && o.ctvId !== ctvId) return false;
        return isOrderEligibleForCommission(o);
    });
}

// Get flagged orders for review
export function getFlaggedOrders(orders: Order[]): Order[] {
    return orders.filter(o => o.flagged || o.fraudStatus === "FLAGGED" || o.fraudStatus === "CONFIRMED");
}
