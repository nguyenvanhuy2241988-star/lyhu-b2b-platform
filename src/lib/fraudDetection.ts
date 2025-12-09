import { Order, FraudStatus } from "./ordersStore";
import { User, normalizePhone, normalizeAddress } from "./usersStore";

export interface FraudDetectionResult {
    flagged: boolean;
    reasons: string[];
    fraudStatus: FraudStatus;
}

export function detectFraudForOrder(params: {
    orderDraft: Partial<Order>;
    currentUser: User;
    allOrders: Order[];
    allUsers: User[];
}): FraudDetectionResult {
    const { orderDraft, currentUser, allOrders } = params;
    const reasons: string[] = [];

    // Only apply for CTV + LYHU_SHIP orders
    if (orderDraft.source !== "CTV" || orderDraft.fulfillmentMode !== "LYHU_SHIP") {
        return { flagged: false, reasons: [], fraudStatus: "NONE" };
    }

    const receiverPhone = normalizePhone(orderDraft.receiverPhone || "");
    const receiverAddress = normalizeAddress(orderDraft.receiverAddress || "");
    const ctvPhone = normalizePhone(currentUser.phone || "");
    const ctvAddress = normalizeAddress(currentUser.address || "");
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // A) Cross-CTV duplicate receiver phone
    if (receiverPhone) {
        const duplicateOrders = allOrders.filter(o => {
            if (o.source !== "CTV") return false;
            if (o.fulfillmentMode !== "LYHU_SHIP") return false;
            if (o.ctvId === currentUser.id) return false;
            if (new Date(o.createdAt) < thirtyDaysAgo) return false;
            return normalizePhone(o.receiverPhone || "") === receiverPhone;
        });

        if (duplicateOrders.length > 0) {
            reasons.push("DUP_RECEIVER_PHONE_CROSS_CTV");
        }
    }

    // B) Self-order phone match
    if (receiverPhone && ctvPhone && receiverPhone === ctvPhone) {
        reasons.push("SELF_ORDER_PHONE_MATCH");
    }

    // C) Self-order address match (soft)
    if (receiverAddress && ctvAddress && receiverAddress.length > 10 && ctvAddress.length > 10) {
        // Check if significant portion matches
        const receiverWords = receiverAddress.split(" ").filter(w => w.length > 2);
        const ctvWords = ctvAddress.split(" ").filter(w => w.length > 2);

        let matchCount = 0;
        for (const word of receiverWords) {
            if (ctvWords.includes(word)) {
                matchCount++;
            }
        }

        // If more than 50% of words match
        if (matchCount >= Math.ceil(receiverWords.length * 0.5) && matchCount >= 3) {
            reasons.push("SELF_ORDER_ADDRESS_MATCH");
        }
    }

    // D) Rapid repeat to same phone
    if (receiverPhone) {
        const recentSamePhoneOrders = allOrders.filter(o => {
            if (o.source !== "CTV") return false;
            if (o.ctvId !== currentUser.id) return false;
            if (new Date(o.createdAt) < fortyEightHoursAgo) return false;
            return normalizePhone(o.receiverPhone || "") === receiverPhone;
        });

        if (recentSamePhoneOrders.length >= 3) {
            reasons.push("RAPID_REPEAT_SAME_RECEIVER");
        }
    }

    return {
        flagged: reasons.length > 0,
        reasons,
        fraudStatus: reasons.length > 0 ? "FLAGGED" : "NONE",
    };
}

export const FRAUD_REASON_LABELS: Record<string, string> = {
    DUP_RECEIVER_PHONE_CROSS_CTV: "SĐT người nhận trùng với CTV khác",
    SELF_ORDER_PHONE_MATCH: "SĐT người nhận trùng với CTV",
    SELF_ORDER_ADDRESS_MATCH: "Địa chỉ người nhận giống CTV",
    RAPID_REPEAT_SAME_RECEIVER: "3+ đơn cùng SĐT trong 48h",
};

export function getFraudReasonLabel(reason: string): string {
    return FRAUD_REASON_LABELS[reason] || reason;
}
