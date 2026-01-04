import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();
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

export type SalesLeadStatus = "NEW" | "CONTACTED" | "IN_PROGRESS" | "WON" | "LOST";

export interface SalesLead {
    id: string;
    storeName: string;
    contactName: string;
    phone: string;
    area: string;
    type: string;
    status: SalesLeadStatus;
    estimatedRevenue: number;
    notes?: string;
    expectedVolume?: number;
    email?: string;
    address?: string;
    createdAt: string;
    assignedTo?: string;
    source?: string;
}

const STORAGE_KEY = "lyhu_sales_leads_v1";

function getDefaultSalesLeads(): SalesLead[] {
    return [];
}

// --- SYNC ---
export function loadSalesLeads(): SalesLead[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function saveSalesLeads(leads: SalesLead[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function addSalesLead(lead: Omit<SalesLead, "id" | "createdAt">): SalesLead {
    const leads = loadSalesLeads();
    const newLead: SalesLead = {
        ...lead,
        id: `lead_${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    leads.unshift(newLead); // Add to top
    saveSalesLeads(leads);
    saveSalesLeads(leads);
    return newLead;
}

export function updateSalesLeadStatus(id: string, status: SalesLeadStatus): SalesLead[] {
    const leads = loadSalesLeads();
    const updated = leads.map(lead =>
        lead.id === id ? { ...lead, status } : lead
    );
    saveSalesLeads(updated);
    return updated;
}

export function getSalesStats(leads: SalesLead[]) {
    return {
        total: leads.length,
        new: leads.filter(l => l.status === "NEW").length,
        contacted: leads.filter(l => l.status === "CONTACTED").length,
        inProgress: leads.filter(l => l.status === "IN_PROGRESS").length,
        won: leads.filter(l => l.status === "WON").length,
        lost: leads.filter(l => l.status === "LOST").length,
        estimatedRevenue: leads.reduce((sum, l) => sum + (l.estimatedRevenue || 0), 0)
    };
}

// --- ASYNC ---
export const fetchSalesLeads = async (userId?: string, token?: string): Promise<SalesLead[]> => {
    if (!userId) {
        console.warn("[fetchSalesLeads] No userId provided, returning empty.");
        return [];
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const headers = getHeaders(token);
        const params = new URLSearchParams({
            select: '*',
            assigned_to: `eq.${userId}`,
            order: 'created_at.desc'
        });
        const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?${params.toString()}`, {
            headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            console.error("Error loading leads:", await res.text());
            return [];
        }

        const data = await res.json();

        return (data || []).map((l: any) => ({
            id: l.id,
            storeName: l.name, // Map 'name' to storeName
            contactName: l.name,
            phone: l.phone,
            address: l.address,
            area: l.address || "Unknown", // Use address as area
            type: "Telesales Lead", // Default
            // Map 'telesales_status' if exists, else fall back or default
            status: (l.telesales_status?.toUpperCase() || l.status?.toUpperCase() || "NEW") as SalesLeadStatus,
            estimatedRevenue: 0,
            // Map notes
            notes: l.telesales_notes || l.note || "",
            createdAt: l.created_at,
            assignedTo: l.assigned_to,
            // Added source for Dashboard display compatibility
            source: l.source || "TELESALES"
        }));
    } catch (err) {
        console.error("fetchSalesLeads Exception:", err);
        return [];
    }
};
