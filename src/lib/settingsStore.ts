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
        email_automation_enabled: boolean;
        // Future: distribution_rules, excluded_sources, etc.
    };
    misa_config?: {
        apiUrl: string;
        appId: string;
        accessCode: string;
        companyCode: string;
    };
}

export interface EmailLog {
    id: string;
    created_at: string;
    recipient_email: string;
    subject: string;
    body_html: string;
    status: string;
    trigger_source: string;
}

export const getAppSecret = async (key: string, token?: string): Promise<any | null> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/app_secrets?key=eq.${encodeURIComponent(key)}&select=value&limit=1`, { headers });
        if (res.ok) {
            const data = await res.json();
            if (data?.[0]?.value) return data[0].value;
        }
    } catch (err) {
        console.warn(`[getAppSecret] Error fetching secret ${key}:`, err);
    }
    return null;
};

export const saveAppSecret = async (key: string, value: any, token?: string, description?: string): Promise<boolean> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/app_secrets`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
                key,
                value,
                description: description || `Secret for ${key}`,
                updated_at: new Date().toISOString()
            })
        });
        return res.ok;
    } catch (err) {
        console.error(`[saveAppSecret] Error saving secret ${key}:`, err);
        return false;
    }
};

export const fetchAppSettings = async (token?: string): Promise<AppSettings | null> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?select=*&limit=1`, { headers });

        if (!res.ok) {
            console.error("fetchAppSettings Error:", await res.text());
            return null;
        }

        const data = await res.json();
        const settings = data?.[0] || null;

        // Fallback: If misa_config is not found in app_settings (or column cleared), fetch from app_secrets
        if (settings && (!settings.misa_config || Object.keys(settings.misa_config).length === 0)) {
            const secretMisa = await getAppSecret('misa_config', token);
            if (secretMisa) {
                settings.misa_config = secretMisa;
            }
        }

        return settings;
    } catch (err) {
        console.error("fetchAppSettings Exception:", err);
        return null;
    }
};

export const fetchEmailLogs = async (token?: string): Promise<EmailLog[]> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/email_logs?select=*&order=created_at.desc&limit=20`, { headers });
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        return [];
    }
}

export const updateAppSettings = async (id: string, updates: Partial<AppSettings>, token?: string): Promise<boolean> => {
    try {
        const headers = getHeaders(token);

        // If updates include misa_config, save it securely into app_secrets
        if (updates.misa_config) {
            await saveAppSecret('misa_config', updates.misa_config, token, 'MISA AMIS ACT Integration Configuration');
        }

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
