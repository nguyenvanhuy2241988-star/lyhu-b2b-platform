// Anti-fraud rules for CTV referral and activation

// Minimum order amount for valid activation (VND)
export const MIN_ACTIVATION_ORDER_AMOUNT = 200000;

// Days to check for duplicate receiver detection
export const DUPLICATE_CHECK_DAYS = 7;

export interface FraudCheckResult {
    passed: boolean;
    reasons: string[];
}

// Check if a child CTV can be linked to a parent
export function checkReferralEligibility(
    childEmail: string,
    childPhone: string | undefined,
    existingUsers: Array<{ email: string; phone?: string; role: string }>
): FraudCheckResult {
    const reasons: string[] = [];

    // Check email uniqueness among CTV users
    const emailExists = existingUsers.some(
        u => u.role === "ctv" && u.email.toLowerCase() === childEmail.toLowerCase()
    );
    if (emailExists) {
        reasons.push("Email đã tồn tại trong hệ thống CTV");
    }

    // Check phone uniqueness among CTV users (if provided)
    if (childPhone) {
        const phoneExists = existingUsers.some(
            u => u.role === "ctv" && u.phone === childPhone
        );
        if (phoneExists) {
            reasons.push("Số điện thoại đã tồn tại trong hệ thống CTV");
        }
    }

    return {
        passed: reasons.length === 0,
        reasons,
    };
}

// Check if an order should be flagged for potential fraud
export function checkOrderForFraud(
    order: {
        ctvId: string;
        fulfillmentMode?: string;
        receiverPhone?: string;
        receiverAddress?: string;
        createdAt: string;
    },
    recentOrders: Array<{
        ctvId: string;
        receiverPhone?: string;
        createdAt: string;
    }>,
    ctvAddress?: string
): FraudCheckResult {
    const reasons: string[] = [];

    if (order.fulfillmentMode !== "LYHU_SHIP") {
        return { passed: true, reasons: [] };
    }

    // Check for duplicate receiver phone in recent orders
    if (order.receiverPhone) {
        const orderDate = new Date(order.createdAt);
        const checkStartDate = new Date(orderDate);
        checkStartDate.setDate(checkStartDate.getDate() - DUPLICATE_CHECK_DAYS);

        const duplicatePhoneOrders = recentOrders.filter(o =>
            o.ctvId === order.ctvId &&
            o.receiverPhone === order.receiverPhone &&
            new Date(o.createdAt) >= checkStartDate &&
            new Date(o.createdAt) <= orderDate
        );

        if (duplicatePhoneOrders.length > 0) {
            reasons.push("SĐT người nhận trùng với đơn gần đây trong 7 ngày");
        }
    }

    // Check if receiver address matches CTV's own address
    if (ctvAddress && order.receiverAddress) {
        const normalizedCtvAddress = ctvAddress.toLowerCase().trim();
        const normalizedReceiverAddress = order.receiverAddress.toLowerCase().trim();

        if (normalizedCtvAddress === normalizedReceiverAddress) {
            reasons.push("Địa chỉ nhận hàng trùng với địa chỉ CTV");
        }
    }

    return {
        passed: reasons.length === 0,
        reasons,
    };
}

// Check if an order qualifies for activation
export function isValidActivationOrder(order: {
    source: string;
    status: string;
    fulfillmentMode?: string;
    totalAmount: number;
    flagged?: boolean;
}): boolean {
    return (
        order.source === "CTV" &&
        order.status === "delivered" &&
        order.fulfillmentMode === "LYHU_SHIP" &&
        order.totalAmount >= MIN_ACTIVATION_ORDER_AMOUNT
        // Optionally: && !order.flagged
    );
}
