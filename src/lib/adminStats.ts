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

// Helper to get today's range if no date provided, or parse provided dates
const getDateRange = (from?: string, to?: string) => {
    // Default to last 30 days if not provided, or "All time"?
    // Existing app fetched *everything*. To match that for now without filters, we allow wide range.
    // However, fast RPC allows us to be precise.

    // If no dates provided, we default to a wide range to simulate "All Time" but safer?
    // Or we should default to "This Month" for better UX? 
    // Let's stick to "All Time" (1970 to now+1y) to preserve existing behavior until UI adds filters.
    const start = from ? new Date(from) : new Date('2023-01-01'); // Project started ~2023?
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    return {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString()
    };
};

export async function getAdminLeadStats(token?: string, fromDate?: string, toDate?: string): Promise<AdminLeadStats> {
    try {
        const headers = getHeaders(token);
        const { p_start_date, p_end_date } = getDateRange(fromDate, toDate);

        // 1. Call RPC for aggregated sums (Fast)
        const statsRes = await fetch(`${SUPABASE_URL}/rpc/get_admin_dashboard_stats`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ p_start_date, p_end_date })
        });

        // 2. Fetch Latest Leads (Limit 10) - Separate fast query
        // We don't filter latest leads by date strictly? Or should we?
        // Usually "Latest activity" ignores filter range or respects it?
        // Let's respect it if possible, but existing `getAdminLeads` fetched all.
        // Let's just fetch latest 10 globally for "Activity Feed" style.
        const latestLeadsRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc&limit=10`, {
            headers
        });

        const statsData = statsRes.ok ? await statsRes.json() : null;
        const leadsData = latestLeadsRes.ok ? await latestLeadsRes.json() : [];

        // Map latest leads
        const latestLeads: AdminLead[] = (leadsData || []).map((l: any) => ({
            id: l.id,
            source: (l.source === 'CTV' ? 'CTV' : 'Sales') as AdminLeadSource,
            name: l.name || "Khách hàng",
            contactName: l.name,
            phone: l.phone,
            area: l.address || "Việt Nam",
            status: l.status || "NEW",
            estimatedRevenue: 0,
            createdAt: l.created_at
        }));

        if (statsData) {
            return {
                totalLeads: statsData.totalLeads || 0,
                totalCTVLeads: statsData.totalCTVLeads || 0,
                totalSalesLeads: statsData.totalSalesLeads || 0,
                totalOrders: statsData.totalOrders || 0,
                totalEstimatedRevenue: statsData.totalEstimatedRevenue || 0, // RPC currently returns 0
                totalOrderRevenue: statsData.totalOrderRevenue || 0,
                convertedLeads: statsData.convertedLeads || 0,
                latestLeads: latestLeads
            };
        }

        // Fallback: If RPC fails (e.g., function not found), use old Slow Method (Client-side aggregation)
        console.warn("[getAdminLeadStats] RPC failed, falling back to client-side aggregation.");
        return getAdminLeadStatsFallback(token);

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

// Old method moved to fallback
async function getAdminLeadStatsFallback(token?: string): Promise<AdminLeadStats> {
    try {
        const headers = getHeaders(token);
        const [allLeads, ordersRes] = await Promise.all([
            getAdminLeads(token),
            fetch(`${SUPABASE_URL}/rest/v1/orders?select=total_amount,status`, { headers })
        ]);

        const ordersData = ordersRes.ok ? await ordersRes.json() : [];

        const totalLeads = allLeads.length;
        const totalCTVLeads = allLeads.filter(l => l.source === 'CTV').length;
        const totalSalesLeads = allLeads.filter(l => l.source === 'Sales').length;
        const totalOrders = ordersData.length;
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
            totalEstimatedRevenue: 0,
            totalOrderRevenue,
            convertedLeads,
            latestLeads,
        };
    } catch (e) {
        return {
            totalLeads: 0, totalCTVLeads: 0, totalSalesLeads: 0, totalOrders: 0,
            totalEstimatedRevenue: 0, totalOrderRevenue: 0, convertedLeads: 0, latestLeads: []
        };
    }
}
