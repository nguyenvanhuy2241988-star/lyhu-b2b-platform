import { supabase } from "@/lib/supabaseClient";
import { getDefaultWarehouseId, reserveStock, shipStock, releaseStock } from "@/lib/inventoryStore";
import { fetchPayrollConfig, addFinancialTransaction, updateTransactionStatus, deleteFinancialTransactions } from "@/lib/payrollStore";

import { Product } from "@/mocks/data";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY || '',
        'Prefer': 'return=representation'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
    }
    return headers;
};

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled' | 'draft';
export type OrderSource = 'TELESALES' | 'CUSTOMER' | 'SALES' | 'CTV' | 'SHOPEE' | 'TIKTOK' | 'WEB' | 'FACEBOOK' | 'ZALO';
export type FraudStatus = "NONE" | "FLAGGED" | "CONFIRMED" | "CLEARED";

export interface OrderItem {
    sku?: string;
    name?: string;
    brand?: string;
    quantity: number;
    unit?: string;
    unitPrice?: number;
    price?: number; // Alias
    subtotal?: number;
    productId: string;
    discount?: number;
    discountType?: 'amount' | 'percent';
    isGift?: boolean;
    is_gift?: boolean; // Alias for specific DB mapping cases
}

export interface Order {
    id: string;
    readableId: number;
    customerName: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    source: OrderSource;
    telesalesUserId?: string;
    items?: OrderItem[];
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
    note?: string; // Alias
    vat?: number;
    paymentMethod?: string;
    ctvPaidAt?: string; // Timestamp when commission was paid
    customer?: {
        phone?: string;
        address?: string;
    };
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
// --- ASYNC (PURE FETCH via RPC) ---
export const fetchOrders = async (token?: string, filters?: { userId?: string, startDate?: string, endDate?: string }): Promise<Order[]> => {
    try {
        const headers = getHeaders(token);

        // Use RPC to bypass potential permission issues with table joins
        const rpcBody = {
            p_user_id: filters?.userId || null,
            p_start_date: filters?.startDate || null,
            p_end_date: filters?.endDate || null,
            p_limit: 200 // Reasonable limit
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/get_orders_v2`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify(rpcBody),
                cache: 'no-store',
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[fetchOrders] RPC Error:", response.status, errorText);

            // Fallback: If RPC fails (e.g. not found), try standard fetch as Last Resort
            // But we know standard fetch is currently broken (403), so we mostly rely on RPC.
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
            leadId: o.lead_id,
            customer: o.customer // Map joined customer data
        }));
    } catch (err) {
        console.error("[fetchOrders] Exception:", err);
        return [];
    }
};

export const callTelesalesMetricsRPC = async (userId: string, startDate: string, endDate: string, token?: string) => {
    try {
        const headers = getHeaders(token);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${SUPABASE_URL}/rpc/get_telesales_metrics_v2`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                p_user_id: userId,
                p_start_date: startDate,
                p_end_date: endDate
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
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
        // Prepare Payload exactly as RPC expects
        const orderPayload = {
            lead_id: orderData.lead_id || orderData.leadId,
            customer_id: orderData.customer_id || orderData.customerId,
            customer_name: orderData.customerName || "Khách hàng",
            telesales_user_id: orderData.telesalesUserId,
            status: orderData.status || 'pending',
            total_amount: orderData.totalAmount,
            source: orderData.source || 'CUSTOMER',
            vat: orderData.vat || 0,
            note: orderData.notes || orderData.note || null,
            payment_method: orderData.paymentMethod || 'COD'
        };

        // Prepare Items
        const itemsToInsert = (orderData.items || []).map((item: any) => ({
            product_id: item.productId,
            quantity: item.quantity,
            price: item.unitPrice || item.price || 0,
            discount: item.discount || 0,
            discount_type: item.discountType || 'amount',
            is_gift: item.isGift || false,
        }));

        // --- EXECUTE RPC ---
        const rpcBody = {
            p_order: orderPayload,
            p_items: itemsToInsert
        };

        const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_order_v2`, {
            method: 'POST',
            headers,
            body: JSON.stringify(rpcBody)
        });

        if (!orderRes.ok) {
            const errBody = await orderRes.text();
            console.error("Error creating order (RPC):", errBody);
            // Fallback? No, permission error will block fallback too.
            return { success: false, error: errBody };
        }

        const orderResData = await orderRes.json();
        // RPC via REST usually returns the object directly, or null
        order = orderResData;

        if (!order) {
            return { success: false, error: "Failed to parse created order" };
        }

        // 2. Reserve Inventory (Async)
        // Note: RPC already inserted items, we just need to reserve stock now.
        if (orderData.items && orderData.items.length > 0) {
            if (warehouseId && orderData.telesalesUserId) {
                // We use original 'orderData.items' because it has 'productId' convenient for us, 
                // but we need the new order.id.
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

        // 3. Check for New Customer Bonus (Telesales)
        if (orderData.source === 'TELESALES' && orderData.telesalesUserId && order) {
            try {
                // Check if this is the first order for this customer
                // Use RPC to bypass permissions

                const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/has_prior_orders`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        p_customer_id: order.customer_id,
                        p_exclude_order_id: order.id
                    })
                });

                // RPC returns true if prior orders exist, false if none.
                // We want isFirstOrder = !hasPrior
                let isFirstOrder = false;
                if (checkRes.ok) {
                    const hasPrior = await checkRes.json();
                    isFirstOrder = !hasPrior;

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
                } else {
                    console.warn("[addOrderSupabase] Bonus check skipped due to permission/error");
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

export const updateOrderSupabase = async (orderId: string, updateData: any, token?: string) => {
    const headers = getHeaders(token);
    const warehouseId = await getDefaultWarehouseId(token);

    try {
        // 1. Fetch current order to check status and get old items
        // Use RPC to bypass permissions
        const currentOrderRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_orders_v2`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ p_id: orderId })
        });

        if (!currentOrderRes.ok) return { success: false, error: "Order not found (RPC)" };
        const currentOrderData = await currentOrderRes.json();
        const currentOrder = currentOrderData[0];

        if (!currentOrder) return { success: false, error: "Order not found" };
        if (currentOrder.status !== 'pending') return { success: false, error: "Only pending orders can be edited" };

        const oldItems = currentOrder.items || [];

        // 2. Revert Old Inventory
        if (warehouseId && currentOrder.telesales_user_id) {
            for (const item of oldItems) {
                try {
                    await releaseStock(
                        warehouseId,
                        item.product_id || item.product?.id, // Handle different item shapes
                        item.quantity,
                        orderId,
                        currentOrder.telesales_user_id,
                        token
                    );
                } catch (err) {
                    console.error("[updateOrderSupabase] Failed to release old stock:", item.product_id, err);
                }
            }
        }

        // 3. Update Order Main Info & Items via RPC
        const updatePayload = {
            total_amount: updateData.totalAmount,
            vat: updateData.vat || 0,
            note: updateData.notes || updateData.note || null,
            payment_method: updateData.paymentMethod || 'COD',
            customer_name: updateData.customerName,
            customer_id: updateData.customer_id || updateData.customerId,
            status: 'pending' // Force keep pending or use status? usually edit keeps it pending.
        };

        const itemsToInsert = (updateData.items || []).map((item: any) => ({
            product_id: item.productId || item.product.id,
            quantity: item.quantity,
            price: item.unitPrice || item.price || 0,
            discount: item.discount || 0,
            discount_type: item.discountType || 'amount',
            is_gift: item.isGift || false,
        }));

        const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_order_v2`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                p_order_id: orderId,
                p_update_data: updatePayload,
                p_items: itemsToInsert
            })
        });

        if (!rpcRes.ok) {
            const err = await rpcRes.text();
            console.error("RPC update_order_v2 failed:", err);
            return { success: false, error: "Failed to update order details: " + err };
        }

        // 4. Reserve New Inventory
        if (warehouseId && currentOrder.telesales_user_id) {
            for (const item of updateData.items) {
                try {
                    await reserveStock(
                        warehouseId,
                        item.productId || item.product.id,
                        item.quantity,
                        orderId,
                        currentOrder.telesales_user_id,
                        token
                    );
                } catch (err) {
                    console.error("[updateOrderSupabase] Failed to reserve new stock:", item.productId, err);
                }
            }
        }

        return { success: true };

    } catch (e: any) {
        console.error("updateOrderSupabase Exception", e);
        return { success: false, error: e.message };
    }
};
