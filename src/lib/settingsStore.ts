import { createClient } from "./supabaseClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY || ''
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
    }
    return headers;
};

export interface AppSettings {
    id: string;
    company_info: any;
    bank_info: any[];
    automation_config: {
        auto_assign_leads: boolean;
        // Future: distribution_rules, excluded_sources, etc.
    };
}

export const fetchAppSettings = async (token?: string): Promise<AppSettings | null> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?select=*&limit=1`, { headers });

        if (!res.ok) {
            console.error("fetchAppSettings Error:", await res.text());
            return null;
        }

        const data = await res.json();
        return data?.[0] || null;
    } catch (err) {
        console.error("fetchAppSettings Exception:", err);
        return null;
    }
};

export const updateAppSettings = async (id: string, updates: Partial<AppSettings>, token?: string): Promise<boolean> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updates)
        });
        return res.ok;
    } catch (err) {
        console.error("updateAppSettings Exception:", err);
        return false;
    }
};
