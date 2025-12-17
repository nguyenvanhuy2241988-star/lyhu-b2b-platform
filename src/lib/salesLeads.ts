import { supabase } from "@/lib/supabaseClient";

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
}

const STORAGE_KEY = "lyhu_sales_leads_v1";

function getDefaultSalesLeads(): SalesLead[] {
    return []; // Return empty or mocks
}

// --- SYNC ---
export function loadSalesLeads(): SalesLead[] {
    if (typeof window === "undefined") return getDefaultSalesLeads();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSalesLeads();
    try {
        return JSON.parse(raw);
    } catch {
        return getDefaultSalesLeads();
    }
}

export function saveSalesLeads(leads: SalesLead[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

// --- ASYNC ---
export const fetchSalesLeads = async (): Promise<SalesLead[]> => {
    const { data, error } = await supabase
        .from('leads')
        .select('*');

    if (error) {
        console.error("Error loading leads:", error);
        return [];
    }

    return data.map((l: any) => ({
        id: l.id,
        storeName: l.name,
        contactName: l.name,
        phone: l.phone,
        area: "Unknown",
        type: "Unknown",
        status: (l.status.toUpperCase() as SalesLeadStatus),
        estimatedRevenue: 0,
        createdAt: l.created_at,
        assignedTo: l.assigned_to
    }));
};
