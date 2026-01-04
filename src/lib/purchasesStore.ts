import { createClient } from "./supabaseClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Prefer': 'return=representation'
});

export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseItem {
    id: string;
    purchaseId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
}

export interface PurchaseOrder {
    id: string;
    vendorName: string;
    vendorId?: string;
    status: PurchaseStatus;
    totalAmount: number;
    orderedAt: string;
    receivedAt?: string;
    items?: PurchaseItem[];
    misa_sync_status?: 'pending' | 'synced';
    notes?: string;
}

export const fetchPurchases = async (token?: string): Promise<PurchaseOrder[]> => {
    try {
        const headers = getHeaders(token);
        // Simplified fetch, assuming a 'purchases' table exists or using a mock wrapper for now
        const res = await fetch(`${SUPABASE_URL}/rest/v1/purchases?select=*,items:purchase_items(*)&order=ordered_at.desc`, { headers });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
};

export const createPurchase = async (order: Partial<PurchaseOrder>, items: Partial<PurchaseItem>[], token?: string) => {
    try {
        const headers = getHeaders(token);
        // 1. Create Purchase
        const res = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
            method: 'POST',
            headers,
            body: JSON.stringify(order)
        });
        if (!res.ok) return null;
        const newOrder = await res.json();
        const purchaseId = newOrder[0].id;

        // 2. Create Items
        const itemsWithId = items.map(item => ({ ...item, purchase_id: purchaseId }));
        await fetch(`${SUPABASE_URL}/rest/v1/purchase_items`, {
            method: 'POST',
            headers,
            body: JSON.stringify(itemsWithId)
        });

        return newOrder[0];
    } catch {
        return null;
    }
};

export const updatePurchaseStatus = async (id: string, status: PurchaseStatus, token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/purchases?id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                status,
                received_at: status === 'received' ? new Date().toISOString() : null
            })
        });
        return res.ok;
    } catch {
        return false;
    }
};
