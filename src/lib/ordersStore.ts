import { Product } from "@/mocks/data";

export type OrderSource = "CUSTOMER" | "SALES";
export type OrderStatus = "pending" | "processing" | "delivered" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
};

export interface OrderItem {
    sku: string;
    name: string;
    brand: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    // Keeping subtotal for convenience, though not explicitly requested, it's useful
    subtotal: number;
}

export interface Order {
    id: string;            // e.g. ORD-2025-001
    customerId: string;    // link to mock customer
    customerName: string;
    source: OrderSource;   // CUSTOMER / SALES
    status: OrderStatus;   // default "pending"
    items: OrderItem[];
    totalAmount: number;
    createdAt: string;     // ISO string
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
        // Dispatch event for cross-component updates
        window.dispatchEvent(new Event("orders-updated"));
    } catch (error) {
        console.error("Failed to save orders:", error);
    }
};

export const addOrder = (orderInput: Omit<Order, "id" | "createdAt" | "status">): Order => {
    const orders = loadOrders();

    // Generate ID: ORD-YYYY-XXX
    const date = new Date();
    const year = date.getFullYear();
    // Find max index for current year to ensure sequentiality
    const currentYearPrefix = `ORD-${year}-`;
    const existingIndices = orders
        .filter(o => o.id.startsWith(currentYearPrefix))
        .map(o => parseInt(o.id.split("-")[2]))
        .filter(n => !isNaN(n));

    const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;
    const id = `${currentYearPrefix}${nextIndex.toString().padStart(3, "0")}`;

    const newOrder: Order = {
        ...orderInput,
        id,
        status: "pending",
        createdAt: date.toISOString(),
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
        totalRevenue: orders
            .filter(o => o.status !== "cancelled")
            .reduce((sum, o) => sum + o.totalAmount, 0)
    };
};
