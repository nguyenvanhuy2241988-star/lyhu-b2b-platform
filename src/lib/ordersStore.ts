import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/mocks/data";

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled' | 'draft';
export type OrderSource = 'TELESALES' | 'CUSTOMER' | 'SALES' | 'CTV';

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
}

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

// --- ASYNC ---
export const fetchOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*),
            customer:customers(name),
            lead:leads(name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading orders:", error);
        return [];
    }

    return data.map((o: any) => ({
        id: o.id,
        readableId: o.readable_id,
        customerName: o.customer?.name || o.lead?.name || "Unknown",
        totalAmount: o.total_amount,
        status: o.status as OrderStatus,
        createdAt: o.created_at,
        source: o.lead_id ? "TELESALES" : "CUSTOMER",
        telesalesUserId: o.telesales_user_id,
        items: o.items
    }));
};

export const addOrderSupabase = async (orderData: any) => {
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            lead_id: orderData.lead_id || orderData.leadId,
            customer_id: orderData.customer_id || orderData.customerId,
            telesales_user_id: orderData.telesalesUserId,
            status: orderData.status || 'draft',
            total_amount: orderData.totalAmount
        })
        .select()
        .single();

    if (error || !order) {
        console.error("Error creating order:", error);
        return null;
    }

    if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map((item: any) => ({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price
        }));

        await supabase.from('order_items').insert(itemsToInsert);
    }
    return order;
};

// Deprecated alias helper to avoid broken imports if possible
// But consumers expecting Promise will now fail if I revert loadOrders to Sync.
// Consumers of loadOrders I just wrote: earnings/page, orders/page.
// I will update THEM.
// Consumers of loadOrders OLD: admin/leaderboard?
// I must ensure new code calls fetchOrders.
