import { loadLeads as loadCTVLeads, CtvLead } from "./ctvLeads";
import { loadSalesLeads, SalesLead } from "./salesLeads";
import { getAllOrders } from "./customerStore";
import type { CustomerOrder } from "@/mocks/data";

export type AdminLeadSource = "CTV" | "Sales" | "Customer Order";

export interface AdminLead {
    id: string;
    source: AdminLeadSource;
    name: string;
    contactName?: string;
    phone?: string;
    area?: string;
    status: string;
    estimatedRevenue?: number;
    createdAt: string;
}

export interface AdminLeadStats {
    totalLeads: number;
    totalCTVLeads: number;
    totalSalesLeads: number;
    totalOrders: number;
    totalEstimatedRevenue: number;
    totalOrderRevenue: number;
    convertedLeads: number;
    latestLeads: AdminLead[];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`
});

export async function getAdminLeads(token?: string): Promise<AdminLead[]> {
    try {
        const headers = getHeaders(token);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const leadsRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, {
            headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const leadsData = leadsRes.ok ? await leadsRes.json() : [];

        const allLeads: AdminLead[] = (leadsData || []).map((l: any) => ({
            id: l.id,
            source: (l.source === 'CTV' ? 'CTV' : 'Sales') as AdminLeadSource,
            name: l.name || "Khách hàng",
            contactName: l.name,
            phone: l.phone,
            area: l.address || "Việt Nam",
            status: l.status || "NEW",
            estimatedRevenue: 0, // Could be enriched if leads table has this
            createdAt: l.created_at
        }));

        allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return allLeads;
    } catch (err) {
        console.error("[getAdminLeads] Error:", err);
        return [];
    }
}

export async function getAdminLeadStats(token?: string): Promise<AdminLeadStats> {
    try {
        const headers = getHeaders(token);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const [allLeads, ordersRes] = await Promise.all([
            getAdminLeads(token),
            fetch(`${SUPABASE_URL}/rest/v1/orders?select=total_amount,status`, {
                headers,
                signal: controller.signal
            })
        ]);

        clearTimeout(timeoutId);
        const ordersData = ordersRes.ok ? await ordersRes.json() : [];

        const totalLeads = allLeads.length;
        const totalCTVLeads = allLeads.filter(l => l.source === 'CTV').length;
        const totalSalesLeads = allLeads.filter(l => l.source === 'Sales').length;
        const totalOrders = ordersData.length;

        const totalEstimatedRevenue = 0; // TBD if needed
        const totalOrderRevenue = ordersData
            .filter((o: any) => o.status !== 'cancelled' && o.status !== 'draft')
            .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

        const convertedLeads = allLeads.filter(l => l.status === 'WON').length;
        const latestLeads = allLeads.slice(0, 10);

        return {
            totalLeads,
            totalCTVLeads,
            totalSalesLeads,
            totalOrders,
            totalEstimatedRevenue,
            totalOrderRevenue,
            convertedLeads,
            latestLeads,
        };
    } catch (err) {
        console.error("[getAdminLeadStats] Error:", err);
        return {
            totalLeads: 0,
            totalCTVLeads: 0,
            totalSalesLeads: 0,
            totalOrders: 0,
            totalEstimatedRevenue: 0,
            totalOrderRevenue: 0,
            convertedLeads: 0,
            latestLeads: [],
        };
    }
}
