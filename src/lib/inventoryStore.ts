import { supabase } from './supabaseClient';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Prefer': 'return=representation' // Useful for RPCs sometimes
});

// Types matching DB schema
export interface InventoryLevel {
    id: string;
    warehouse_id: string;
    product_id: string;
    quantity_on_hand: number;
    quantity_committed: number;
    quantity_available: number;
    updated_at: string;
}

export interface InventoryTransaction {
    id: string;
    warehouse_id: string;
    product_id: string;
    type: 'inbound' | 'outbound' | 'reserve' | 'release' | 'adjustment';
    quantity: number;
    reference_type?: string;
    reference_id?: string;
    note?: string;
    performed_by?: string;
    created_at: string;
}

export interface RPCResponse {
    success: boolean;
    message?: string;
    available?: number;
}

// ==========================================================
// CORE FUNCTIONS (Calling RPCs)
// ==========================================================

/**
 * Reserve stock for an order (Giữ hàng)
 * Use when Order is CREATED or CONFIRMED
 */
export async function reserveStock(
    warehouseId: string,
    productId: string,
    quantity: number,
    orderId: string,
    userId: string,
    token?: string
): Promise<RPCResponse> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_reserve_stock`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                p_warehouse_id: warehouseId,
                p_product_id: productId,
                p_quantity: quantity,
                p_ref_id: orderId,
                p_user_id: userId
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error calling fn_reserve_stock');
        }

        const data = await res.json();
        return data as RPCResponse;
    } catch (err: any) {
        console.error('reserveStock error:', err);
        return { success: false, message: err.message || 'Lỗi giữ hàng' };
    }
}

/**
 * Release stock (Nhả hàng)
 * Use when Order is CANCELLED
 */
export async function releaseStock(
    warehouseId: string,
    productId: string,
    quantity: number,
    orderId: string,
    userId: string,
    token?: string
): Promise<RPCResponse> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_release_stock`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                p_warehouse_id: warehouseId,
                p_product_id: productId,
                p_quantity: quantity,
                p_ref_id: orderId,
                p_user_id: userId
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error calling fn_release_stock');
        }

        const data = await res.json();
        return data as RPCResponse;
    } catch (err: any) {
        console.error('releaseStock error:', err);
        return { success: false, message: err.message || 'Lỗi nhả hàng' };
    }
}

/**
 * Ship stock (Xuất kho)
 * Use when Order is SHIPPED/COMPLETED
 */
export async function shipStock(
    warehouseId: string,
    productId: string,
    quantity: number,
    orderId: string,
    userId: string,
    token?: string
): Promise<RPCResponse> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_ship_stock`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                p_warehouse_id: warehouseId,
                p_product_id: productId,
                p_quantity: quantity,
                p_ref_id: orderId,
                p_user_id: userId
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error calling fn_ship_stock');
        }

        const data = await res.json();
        return data as RPCResponse;
    } catch (err: any) {
        console.error('shipStock error:', err);
        return { success: false, message: err.message || 'Lỗi xuất kho' };
    }
}

/**
 * Add stock (Nhập kho)
 * Use for Manual Inbound or Purchase Order
 */
export async function addStock(
    warehouseId: string,
    productId: string,
    quantity: number,
    userId: string,
    note: string = 'Nhập hàng thủ công',
    token?: string
): Promise<RPCResponse> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_add_stock`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                p_warehouse_id: warehouseId,
                p_product_id: productId,
                p_quantity: quantity,
                p_user_id: userId,
                p_note: note
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error calling fn_add_stock');
        }

        const data = await res.json();
        return data as RPCResponse;
    } catch (err: any) {
        console.error('addStock error:', err);
        return { success: false, message: err.message || 'Lỗi nhập kho' };
    }
}

// ==========================================================
// QUERY FUNCTIONS
// ==========================================================

export async function getInventoryLevel(productId: string, warehouseId?: string, token?: string): Promise<InventoryLevel | null> {
    try {
        const headers = getHeaders(token);

        // If warehouseId not provided, verify if we have a default one.
        let targetWarehouseId = warehouseId;

        if (!targetWarehouseId) {
            // Fetch default warehouse via API
            const whRes = await fetch(`${SUPABASE_URL}/rest/v1/warehouses?select=id&code=eq.MAIN-HN&limit=1`, { headers });
            if (whRes.ok) {
                const whData = await whRes.json();
                if (whData && whData.length > 0) targetWarehouseId = whData[0].id;
            }
        }

        if (!targetWarehouseId) return null;

        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/inventory_levels?select=*&warehouse_id=eq.${targetWarehouseId}&product_id=eq.${productId}&limit=1`,
            { headers }
        );

        if (!res.ok) throw new Error('Failed to fetch inventory level');

        const data = await res.json();
        const level = data && data.length > 0 ? data[0] : null;

        return level as InventoryLevel;
    } catch (err) {
        console.error('getInventoryLevel error:', err);
        return null;
    }
}

export async function getDefaultWarehouseId(token?: string): Promise<string | null> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/warehouses?select=id&status=eq.active&order=created_at.asc&limit=1`,
            { headers }
        );

        if (!res.ok) return null;

        const data = await res.json();
        return data && data.length > 0 ? data[0].id : null;
    } catch { return null; }
}
export async function fetchAllInventoryLevels(warehouseId?: string, token?: string): Promise<(InventoryLevel & { product: { name: string; sku: string; brand: string } })[]> {
    try {
        const headers = getHeaders(token);
        let targetWarehouseId = warehouseId;
        if (!targetWarehouseId) {
            targetWarehouseId = await getDefaultWarehouseId(token) || undefined;
        }

        if (!targetWarehouseId) return [];

        const select = '*,product:products(name,sku,brand)';
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/inventory_levels?select=${select}&warehouse_id=eq.${targetWarehouseId}&order=product_id.asc`,
            { headers }
        );

        if (!res.ok) {
            const err = await res.json();
            console.error('fetchAllInventoryLevels API error:', err);
            return [];
        }

        return await res.json();
    } catch (err) {
        console.error('fetchAllInventoryLevels exception:', err);
        return [];
    }
}

export async function fetchPaginatedInventory(
    page: number = 1,
    pageSize: number = 20,
    searchTerm?: string,
    warehouseId?: string,
    token?: string
): Promise<{ data: any[]; count: number }> {
    try {
        const headers = getHeaders(token);
        let targetWarehouseId = warehouseId;
        if (!targetWarehouseId) {
            targetWarehouseId = await getDefaultWarehouseId(token) || undefined;
        }

        if (!targetWarehouseId) return { data: [], count: 0 };

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Note: We use ilike on the joined product name. 
        // PostgREST syntax for filtering on joined table: product.name.ilike.*searchTerm*
        const select = '*,product:products!inner(name,sku,brand)';
        let url = `${SUPABASE_URL}/rest/v1/inventory_levels?select=${select}&warehouse_id=eq.${targetWarehouseId}`;

        if (searchTerm) {
            // Filter by name or SKU
            url += `&or=(product.name.ilike.*${searchTerm}*,product.sku.ilike.*${searchTerm}*)`;
        }

        url += `&order=product(name).asc&offset=${from}&limit=${pageSize}`;

        const res = await fetch(url, {
            headers: { ...headers, 'Prefer': 'count=exact' }
        });

        if (!res.ok) {
            const err = await res.json();
            console.error('fetchPaginatedInventory API error:', err);
            return { data: [], count: 0 };
        }

        const countHeader = res.headers.get('content-range');
        const count = countHeader ? parseInt(countHeader.split('/')[1]) : 0;
        const data = await res.json();

        return { data, count };
    } catch (err) {
        console.error('fetchPaginatedInventory exception:', err);
        return { data: [], count: 0 };
    }
}
export async function fetchInventoryTransactions(warehouseId?: string, limit = 50, token?: string): Promise<(InventoryTransaction & { product: { name: string; sku: string } })[]> {
    try {
        const headers = getHeaders(token);
        let targetWarehouseId = warehouseId;
        if (!targetWarehouseId) {
            targetWarehouseId = await getDefaultWarehouseId(token) || undefined;
        }

        if (!targetWarehouseId) return [];

        const select = '*,product:products(name,sku)';
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/inventory_transactions?select=${select}&warehouse_id=eq.${targetWarehouseId}&order=created_at.desc&limit=${limit}`,
            { headers }
        );

        if (!res.ok) {
            const err = await res.json();
            console.error('fetchInventoryTransactions API error:', err);
            return [];
        }

        return await res.json();
    } catch (err) {
        console.error('fetchInventoryTransactions exception:', err);
        return [];
    }
}

/**
 * Fetch products with low stock alerts
 */
export async function fetchStockAlerts(warehouseId?: string, token?: string): Promise<any[]> {
    try {
        const headers = getHeaders(token);
        let targetWarehouseId = warehouseId;
        if (!targetWarehouseId) {
            targetWarehouseId = await getDefaultWarehouseId(token) || undefined;
        }

        if (!targetWarehouseId) return [];

        // Note: Complex filters with .inner join are tricky in PostgREST select string
        // but we can use an RPC or just filter after fetching if it's small, 
        // however we already have quantity_available and min_stock_level logic.
        // Let's use the stats-like logic but for returning rows.
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/inventory_levels?select=*,product:products(id,name,sku,min_stock_level)&warehouse_id=eq.${targetWarehouseId}`,
            { headers }
        );

        if (!res.ok) throw new Error('Failed to fetch stock alerts');
        const data = await res.json();

        // Filter locally to match the min_stock_level logic
        return data.filter((l: any) => {
            const min = l.product?.min_stock_level || 10;
            const available = l.quantity_available ?? 0;
            return available <= min;
        });
    } catch (err) {
        console.error('fetchStockAlerts exception:', err);
        return [];
    }
}

/**
 * Fetch general statistics for Warehouse Dashboard
 */
export async function fetchWarehousingStats(warehouseId?: string, token?: string) {
    try {
        const headers = getHeaders(token);
        let targetWarehouseId = warehouseId;
        if (!targetWarehouseId) {
            targetWarehouseId = await getDefaultWarehouseId(token) || undefined;
        }

        if (!targetWarehouseId) return { totalProducts: 0, lowStock: 0, outOfStock: 0, ordersToPack: 0 };

        // 1. Fetch Inventory Summary via REST API
        const invRes = await fetch(
            `${SUPABASE_URL}/rest/v1/inventory_levels?select=quantity_on_hand,quantity_available,product:products(min_stock_level)&warehouse_id=eq.${targetWarehouseId}`,
            { headers }
        );

        if (!invRes.ok) throw new Error('Failed to fetch inventory stats');
        const levels = await invRes.json();

        // 2. Fetch Orders Count via REST API (pending/processing)
        // Using prefer=count=exact to get count without fetching all rows
        const ordRes = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?select=id&status=in.(pending,processing)`,
            { headers: { ...headers, 'Prefer': 'count=exact,head=true' } }
        );

        const ordersCountStr = ordRes.headers.get('content-range')?.split('/')?.[1];
        const ordersToPack = ordersCountStr ? parseInt(ordersCountStr) : 0;

        const totalProducts = levels?.length || 0;
        const outOfStock = levels?.filter((l: any) => (l.quantity_available ?? 0) <= 0).length || 0;
        const lowStock = levels?.filter((l: any) => {
            const min = l.product?.min_stock_level || 10;
            const available = l.quantity_available ?? 0;
            return available > 0 && available <= min;
        }).length || 0;

        console.log('[inventoryStore] Stats loaded via API:', {
            totalProducts,
            lowStock,
            outOfStock,
            ordersToPack
        });

        return {
            totalProducts,
            lowStock,
            outOfStock,
            ordersToPack
        };
    } catch (err) {
        console.error('fetchWarehousingStats error:', err);
        return { totalProducts: 0, lowStock: 0, outOfStock: 0, ordersToPack: 0 };
    }
}

/**
 * Adjust stock manually (Audit/Adjustment)
 */
export async function adjustStock(
    warehouseId: string,
    productId: string,
    newQuantity: number,
    userId: string,
    note: string,
    token?: string
): Promise<{ success: boolean; message: string }> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_adjust_stock`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                p_warehouse_id: warehouseId,
                p_product_id: productId,
                p_new_quantity: newQuantity,
                p_user_id: userId,
                p_note: note
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error calling fn_adjust_stock');
        }

        const data = await res.json();
        return data as { success: boolean; message: string };
    } catch (err: any) {
        console.error('adjustStock exception:', err);
        return { success: false, message: err.message };
    }
}

export async function fetchOrdersForFulfillment(token?: string): Promise<any[]> {
    try {
        const headers = getHeaders(token);
        // Using PostgREST syntax for nested joins
        const select = '*,items:order_items(id,quantity,price,product:products(id,name,sku,brand))';
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?select=${select}&status=in.(pending,processing)&order=created_at.asc`,
            { headers }
        );

        if (!res.ok) {
            const err = await res.json();
            console.error('fetchOrdersForFulfillment API error:', err);
            return [];
        }

        return await res.json();
    } catch (err) {
        console.error('fetchOrdersForFulfillment exception:', err);
        return [];
    }
}
