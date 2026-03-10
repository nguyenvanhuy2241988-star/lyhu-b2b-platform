import { createClient } from "./supabaseClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Prefer': 'return=representation'
});

export interface MisaProduct {
    id: string;
    sku: string;
    name: string;
    misa_code?: string;
    unit?: string;
}

export const fetchMasterProducts = async (token?: string): Promise<MisaProduct[]> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,sku,name,misa_code,unit&order=name.asc`, { headers });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
};

export const updateProductMisa = async (productId: string, misaCode: string, token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ misa_code: misaCode })
        });
        return res.ok;
    } catch {
        return false;
    }
};

export const fetchMasterWarehouses = async (token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/warehouses?select=*&order=name.asc`, { headers });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
};

// MISA Integration Functions

export interface MisaItem {
    inventory_item_code: string;
    inventory_item_name: string;
    unit_name: string;
    inventory_item_id: string;
}

/** Fetch product catalog from MISA via API */
export const fetchMisaProducts = async (): Promise<{ success: boolean; items: MisaItem[]; error?: string }> => {
    try {
        const res = await fetch('/api/misa/sync-products', { method: 'POST' });
        const data = await res.json();
        if (!data.success) return { success: false, items: [], error: data.error };
        return { success: true, items: data.items || [] };
    } catch (e: any) {
        return { success: false, items: [], error: e.message };
    }
};

/** Auto-map products by matching SKU with MISA inventory_item_code */
export const autoMapMisaProducts = async (): Promise<{
    success: boolean;
    matched: number;
    unmatched: number;
    error?: string;
    matched_details?: any[];
    unmatched_details?: any[];
}> => {
    try {
        const res = await fetch('/api/misa/auto-map', { method: 'POST' });
        const data = await res.json();
        return data;
    } catch (e: any) {
        return { success: false, matched: 0, unmatched: 0, error: e.message };
    }
};

/** Batch update misa_code for multiple products */
export const batchMapProducts = async (mappings: { product_id: string; misa_code: string }[]): Promise<{
    success: boolean;
    updated: number;
    total: number;
    error?: string;
}> => {
    try {
        const res = await fetch('/api/misa/batch-map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mappings }),
        });
        return await res.json();
    } catch (e: any) {
        return { success: false, updated: 0, total: 0, error: e.message };
    }
};
