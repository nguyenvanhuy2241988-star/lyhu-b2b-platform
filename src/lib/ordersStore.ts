import { Product, mockProducts } from "@/mocks/data";
import { getCustomerUnitPrice, getCtvSelfShipUnitPrice } from "./pricing";

export type OrderSource = "CUSTOMER" | "SALES" | "CTV";
export type OrderStatus = "pending" | "processing" | "delivered" | "cancelled";
export type FulfillmentMode = "SELF_SHIP" | "LYHU_SHIP";
export type FraudStatus = "NONE" | "FLAGGED" | "CLEARED" | "CONFIRMED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
};

export const FRAUD_STATUS_LABELS: Record<FraudStatus, string> = {
    NONE: "Bình thường",
    FLAGGED: "Đánh dấu",
    CLEARED: "Đã xóa cờ",
    CONFIRMED: "Xác nhận gian lận",
};

export interface OrderItem {
    sku: string;
    name: string;
    brand: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    subtotal: number;
    productId?: string;
}

export interface Order {
    id: string;
    customerId: string;
    customerName: string;
    source: OrderSource;
    status: OrderStatus;
    items: OrderItem[];
    totalAmount: number;
    createdAt: string;

    // CTV fields
    fulfillmentMode?: FulfillmentMode;
    ctvId?: string;
    ctvName?: string;
    ctvCommission?: number;

    // CTV referral fields
    ctvReferralCode?: string;
    ctvReferredByCode?: string;

    // Anti-fraud flags (enhanced)
    flagged?: boolean;
    flaggedReasons?: string[];
    fraudStatus?: FraudStatus;
    reviewedByAdminAt?: string;
    reviewedByAdminNote?: string;

    // Payout tracking
    ctvPaidAt?: string;
    ctvPayoutId?: string;

    // Additional fields for LYHU_SHIP
    receiverPhone?: string;
    receiverAddress?: string;
    notes?: string;
}

const STORAGE_KEY = "lyhu_orders";

export const loadOrders = (): Order[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to load orders:", error);
        return [];
    }
};

export const saveOrders = (orders: Order[]) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        window.dispatchEvent(new Event("orders-updated"));
    } catch (error) {
        console.error("Failed to save orders:", error);
    }
};

export function calculateCtvCommission(params: {
    mode: FulfillmentMode;
    items: OrderItem[];
}): number {
    const { mode, items } = params;
    let totalCommission = 0;

    items.forEach(item => {
        const product = mockProducts.find(p => p.id === item.productId || p.sku === item.sku);

        if (product) {
            if (mode === "SELF_SHIP") {
                const selfShipUnitPrice = getCtvSelfShipUnitPrice(product, item.quantity);
                const discountPerUnit = Math.max(0, product.basePricePerUnit - selfShipUnitPrice);
                totalCommission += discountPerUnit * item.quantity;
            } else if (mode === "LYHU_SHIP") {
                const customerUnitPrice = getCustomerUnitPrice(product, item.quantity);
                const lineTotal = customerUnitPrice * item.quantity;
                totalCommission += lineTotal * product.ctvCommissionRate;
            }
        }
    });

    return totalCommission;
}

export const addOrder = (orderInput: Omit<Order, "id" | "createdAt" | "status">): Order => {
    const orders = loadOrders();

    const date = new Date();
    const year = date.getFullYear();
    const currentYearPrefix = `ORD-${year}-`;
    const existingIndices = orders
        .filter(o => o.id.startsWith(currentYearPrefix))
        .map(o => parseInt(o.id.split("-")[2]))
        .filter(n => !isNaN(n));

    const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;
    const id = `${currentYearPrefix}${nextIndex.toString().padStart(3, "0")}`;

    let ctvCommission = 0;
    if (orderInput.source === "CTV" && orderInput.fulfillmentMode) {
        if (orderInput.ctvCommission !== undefined) {
            ctvCommission = orderInput.ctvCommission;
        } else {
            ctvCommission = calculateCtvCommission({
                mode: orderInput.fulfillmentMode,
                items: orderInput.items
            });
        }
    }

    const newOrder: Order = {
        ...orderInput,
        id,
        status: "pending",
        createdAt: date.toISOString(),
        ctvCommission: ctvCommission > 0 ? ctvCommission : undefined,
        fraudStatus: orderInput.flagged ? "FLAGGED" : "NONE",
    };

    const updatedOrders = [newOrder, ...orders];
    saveOrders(updatedOrders);
    return newOrder;
};

export const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const orders = loadOrders();
    const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status } : order
    );
    saveOrders(updatedOrders);
    return updatedOrders;
};

export const updateOrderFraudStatus = (
    orderId: string,
    fraudStatus: FraudStatus,
    note?: string
) => {
    const orders = loadOrders();
    const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
            return {
                ...order,
                fraudStatus,
                flagged: fraudStatus === "FLAGGED" || fraudStatus === "CONFIRMED",
                flaggedReasons: fraudStatus === "CLEARED" ? [] : order.flaggedReasons,
                reviewedByAdminAt: new Date().toISOString(),
                reviewedByAdminNote: note,
            };
        }
        return order;
    });
    saveOrders(updatedOrders);
    return updatedOrders;
};

export const filterOrdersByStatus = (
    orders: Order[],
    status: OrderStatus | "all"
): Order[] => {
    if (status === "all") return orders;
    return orders.filter(o => o.status === status);
};

export const getOrdersByCustomer = (customerId: string): Order[] => {
    const orders = loadOrders();
    return orders.filter(order => order.customerId === customerId);
};

export const getOrdersSummary = () => {
    const orders = loadOrders();
    return {
        totalOrders: orders.length,
        totalPending: orders.filter(o => o.status === "pending").length,
        totalProcessing: orders.filter(o => o.status === "processing").length,
        totalDelivered: orders.filter(o => o.status === "delivered").length,
        totalCancelled: orders.filter(o => o.status === "cancelled").length,
        totalFlagged: orders.filter(o => o.flagged).length,
        totalRevenue: orders
            .filter(o => o.status !== "cancelled")
            .reduce((sum, o) => sum + o.totalAmount, 0)
    };
};
