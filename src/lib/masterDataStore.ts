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
