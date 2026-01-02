import { supabase } from "@/lib/supabaseClient";
import { getDefaultWarehouseId, reserveStock, shipStock, releaseStock } from "@/lib/inventoryStore";
import { fetchPayrollConfig, addFinancialTransaction, updateTransactionStatus, deleteFinancialTransactions } from "@/lib/payrollStore";

import { Product } from "@/mocks/data";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Prefer': 'return=representation'
});

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled' | 'draft';
export type OrderSource = 'TELESALES' | 'CUSTOMER' | 'SALES' | 'CTV' | 'SHOPEE' | 'TIKTOK' | 'WEB' | 'FACEBOOK' | 'ZALO';
export type FraudStatus = "NONE" | "FLAGGED" | "CONFIRMED" | "CLEARED";

export interface Order {
    id: string;
    readableId: number;
    customerName: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    source: OrderSource;
    telesalesUserId?: string;
    items?: any[];
    customerId?: string;
    leadId?: string;
    flagged?: boolean; // For fraud scan
    fraudStatus?: FraudStatus;

    // CTV / Extended Fields
    ctvId?: string;
    ctvCommission?: number;
    fulfillmentMode?: FulfillmentMode;
    receiverPhone?: string;
    receiverAddress?: string;
    notes?: string;
    ctvPaidAt?: string; // Timestamp when commission was paid
}

export type FulfillmentMode = 'SELF_SHIP' | 'LYHU_SHIP';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
    draft: "Nháp"
};

export const FRAUD_STATUS_LABELS: Record<FraudStatus, string> = {
    NONE: "An toàn",
    FLAGGED: "Cảnh báo",
    CONFIRMED: "Gian lận",
    CLEARED: "Đã xác minh",
};

const STORAGE_KEY = "lyhu_all_orders";

// --- SYNC ---
export const loadOrders = (): Order[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const saveOrders = (orders: Order[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event("orders-updated"));
};

export const addOrder = (orderData: any): Order => {
    const orders = loadOrders();
    const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        readableId: Date.now(),
        customerName: orderData.customerName || "Unknown",
        totalAmount: orderData.totalAmount || 0,
        status: orderData.status || 'pending',
        createdAt: new Date().toISOString(),
        source: orderData.source || 'CUSTOMER',
        ...orderData
    };
    saveOrders([newOrder, ...orders]);
    return newOrder;
};

// --- HELPERS (Restored for Admin) ---
export const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    userId?: string,  // Optional: for inventory actions
    token?: string
): Promise<boolean> => {
    // 1. Sync Update (localStorage) - for local UI
    const orders = loadOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    saveOrders(updated);

    // 2. For Supabase orders (UUIDs), get old status first then update
    if (!orderId.startsWith("ORD-")) {
        const headers = getHeaders(token);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Fetch current status from DB before updating (using FETCH)
        const fetchRes = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?select=status&id=eq.${orderId}&limit=1`,
            {
                headers,
                cache: 'no-store',
                signal: controller.signal
            }
        );

        let oldStatus: OrderStatus | undefined;
        if (fetchRes.ok) {
            const data = await fetchRes.json();
            if (data && data.length > 0) oldStatus = data[0].status;
        }

        // Update status in DB (using FETCH)
        const updateRes = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
            {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status: newStatus }),
                cache: 'no-store',
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        if (!updateRes.ok) {
            const errText = await updateRes.text();
            console.error("[updateOrderStatus] Supabase update failed:", errText);
            return false;
        }

        // 3. Inventory Actions based on status change
        if (userId && oldStatus && oldStatus !== newStatus) {
            if (newStatus === 'delivered' && oldStatus !== 'delivered') {
                await shipOrderInventory(orderId, userId, token);
                // Update Bonus status to finalized
                await updateTransactionStatus(orderId, 'finalized', token);
            } else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
                await releaseOrderInventory(orderId, userId, token);
                // Delete bonus if order is cancelled
                await deleteFinancialTransactions(orderId, token);
            }
        } else if (!userId) {
            console.warn("[updateOrderStatus] No userId provided - skipping inventory actions");
        }
        return true;
    }
    return true; // Local orders always success for now
};

// Helper: Ship all items in an order (when delivered)
async function shipOrderInventory(orderId: string, userId: string, token?: string) {
    const warehouseId = await getDefaultWarehouseId(token);
    if (!warehouseId) {
        console.warn("[shipOrderInventory] No warehouse found");
        return;
    }

    // Fetch order items using FETCH
    const headers = getHeaders(token);
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/order_items?select=product_id,quantity&order_id=eq.${orderId}`,
        { headers }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[shipOrderInventory] Failed to fetch items:", err);
        return;
    }

    const items = await res.json();

    // Ship each item
    for (const item of items) {
        try {
            await shipStock(warehouseId, item.product_id, item.quantity, orderId, userId, token);
        } catch (err) {
            console.error("[shipOrderInventory] Failed to ship:", item.product_id, err);
        }
    }
}

// Helper: Release all items in an order (when cancelled)
async function releaseOrderInventory(orderId: string, userId: string, token?: string) {
    const warehouseId = await getDefaultWarehouseId(token);
    if (!warehouseId) {
        console.warn("[releaseOrderInventory] No warehouse found");
        return;
    }

    // Fetch order items using FETCH
    const headers = getHeaders(token);
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/order_items?select=product_id,quantity&order_id=eq.${orderId}`,
        { headers }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[releaseOrderInventory] Failed to fetch items:", err);
        return;
    }

    const items = await res.json();

    // Release each item
    for (const item of items) {
        try {
            await releaseStock(warehouseId, item.product_id, item.quantity, orderId, userId, token);
        } catch (err) {
            console.error("[releaseOrderInventory] Failed to release:", item.product_id, err);
        }
    }
}

export const getOrdersSummary = () => {
    const orders = loadOrders();
    return {
        totalOrders: orders.length,
        totalPending: orders.filter(o => o.status === 'pending').length,
        totalProcessing: orders.filter(o => o.status === 'processing').length,
        totalDelivered: orders.filter(o => o.status === 'delivered').length,
        totalCancelled: orders.filter(o => o.status === 'cancelled').length,
        totalRevenue: orders.filter(o => o.status !== 'cancelled' && o.status !== 'draft')
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
};

export const filterOrdersByStatus = (orders: Order[], status: OrderStatus | 'all'): Order[] => {
    if (status === 'all') return orders;
    return orders.filter(o => o.status === status);
};

export const getOrdersByCustomer = (customerId: string): Order[] => {
    const orders = loadOrders();
    return orders.filter(o => o.customerId === customerId);
};

// --- ASYNC ---
// --- ASYNC (PURE FETCH) ---
export const fetchOrders = async (token?: string, filters?: { userId?: string, startDate?: string, endDate?: string }): Promise<Order[]> => {
    try {
        const headers = getHeaders(token);
        let query = `select=*,items:order_items(*,product:products(name,sku))&order=created_at.desc`;

        if (filters?.userId) {
            query += `&telesales_user_id=eq.${filters.userId}`;
        }
        if (filters?.startDate) {
            query += `&created_at=gte.${filters.startDate}`;
        }
        if (filters?.endDate) {
            query += `&created_at=lte.${filters.endDate}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s for potentially larger data

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?${query}`,
            {
                headers,
                cache: 'no-store',
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[fetchOrders] Error:", response.status, errorText);
            return [];
        }

        const data = await response.json();

        return (data || []).map((o: any) => ({
            id: o.id,
            readableId: o.readable_id,
            customerName: o.customer_name || "Khách hàng",
            totalAmount: o.total_amount,
            status: o.status as OrderStatus,
            createdAt: o.created_at,
            source: o.source || "TELESALES",
            telesalesUserId: o.telesales_user_id,
            items: o.items,
            customerId: o.customer_id,
            leadId: o.lead_id
        }));
    } catch (err) {
        console.error("[fetchOrders] Exception:", err);
        return [];
    }
};

export const callTelesalesMetricsRPC = async (userId: string, startDate: string, endDate: string, token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rpc/get_telesales_metrics_v2`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                p_user_id: userId,
                p_start_date: startDate,
                p_end_date: endDate
            })
        });

        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};


export const addOrderSupabase = async (orderData: any, token?: string) => {
    const headers = getHeaders(token);
    const warehouseId = await getDefaultWarehouseId(token);

    let order: any = null;

    try {
        const orderPayload = {
            lead_id: orderData.lead_id || orderData.leadId,
            customer_id: orderData.customer_id || orderData.customerId,
            customer_name: orderData.customerName || "Khách hàng",
            telesales_user_id: orderData.telesalesUserId,
            status: orderData.status || 'pending',
            total_amount: orderData.totalAmount,
            source: orderData.source || 'CUSTOMER'
        };

        const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderPayload)
        });

        if (!orderRes.ok) {
            const errBody = await orderRes.text();
            console.error("Error creating order:", errBody);
            return { success: false, error: errBody };
        }

        const orderResData = await orderRes.json();
        order = Array.isArray(orderResData) ? orderResData[0] : orderResData;

        if (!order) {
            return { success: false, error: "Failed to parse created order" };
        }

        // 2. Create Order Items & Reserve Stock
        if (orderData.items && orderData.items.length > 0) {
            const itemsToInsert = orderData.items.map((item: any) => ({
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                price: item.unitPrice || item.price || 0
            }));

            const itemsRes = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
                method: 'POST',
                headers,
                body: JSON.stringify(itemsToInsert)
            });

            if (!itemsRes.ok) {
                const errItems = await itemsRes.text();
                console.error("Error creating order items:", errItems);
                return { success: true, data: order, warning: "Order created but items failed: " + errItems };
            }

            // 3. Reserve Inventory (Async)
            if (warehouseId && orderData.telesalesUserId) {
                for (const item of orderData.items) {
                    try {
                        await reserveStock(
                            warehouseId,
                            item.productId,
                            item.quantity,
                            order.id,
                            orderData.telesalesUserId,
                            token
                        );
                    } catch (err) {
                        console.error("[addOrderSupabase] Reserve failed:", item.productId, err);
                    }
                }
            }
        }

        // 4. Check for New Customer Bonus (Telesales)
        if (orderData.source === 'TELESALES' && orderData.telesalesUserId && order) {
            try {
                // Check if this is the first order for this customer
                const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?customer_id=eq.${order.customer_id}&id=neq.${order.id}&limit=1`, { headers });
                const isFirstOrder = checkRes.ok && (await checkRes.json()).length === 0;

                if (isFirstOrder) {
                    const payrollConfig = await fetchPayrollConfig('telesales_parttime', token);
                    if (payrollConfig) {
                        let bonusAmount = payrollConfig.bonusNewAgency; // Default 300k
                        let category = 'Mở mới Đại lý';

                        if (orderData.customerType === 'SUPERMARKET') {
                            bonusAmount = payrollConfig.bonusNewSupermarket;
                            category = 'Mở mới Siêu thị';
                        } else if (orderData.customerType === 'DISTRIBUTOR') {
                            bonusAmount = payrollConfig.bonusNewDistributor;
                            category = 'Mở mới NPP';
                        }

                        await addFinancialTransaction({
                            userId: orderData.telesalesUserId,
                            type: 'bonus',
                            category,
                            amount: bonusAmount,
                            status: 'estimated',
                            referenceId: order.id,
                            note: `Thưởng mở mới khách hàng cho đơn #${order.readable_id}`
                        }, token);
                    }
                }
            } catch (err) {
                console.error("[addOrderSupabase] Bonus check failed:", err);
            }
        }

        return { success: true, data: order };

    } catch (e: any) {
        console.error("addOrderSupabase Exception", e);
        return { success: false, error: e.message };
    }
};
