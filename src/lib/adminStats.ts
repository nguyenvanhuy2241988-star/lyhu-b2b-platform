import { loadLeads as loadCTVLeads, CtvLead } from "./ctvLeads";
import { loadSalesLeads, SalesLead } from "./salesLeads";
import { getAllOrders } from "./customerStore";
import type { CustomerOrder } from "@/mocks/data";
import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();

export type AdminLeadSource = "CTV" | "Sales" | "Telesales" | "Customer Order";

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
    totalTelesalesLeads: number;
    totalOrders: number;
    totalEstimatedRevenue: number;
    totalOrderRevenue: number;
    totalProfit: number;
    convertedLeads: number;
    latestLeads: AdminLead[];
}

export interface TopProduct {
    productName: string;
    sku: string;
    quantity: number;
    revenue: number;
    profit: number;
}

export interface FunnelStat {
    stage: string;
    count: number;
}

export async function getAdminLeads(): Promise<AdminLead[]> {
    try {
        const { data, error } = await supabase
            .from('crm_leads')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const allLeads: AdminLead[] = (data || []).map((l: any) => ({
            id: l.id,
            source: (['CTV', 'Sales', 'Telesales'].includes(l.source) ? l.source : 'Sales') as AdminLeadSource,
            name: l.title || l.customer_name || "Khách hàng",
            contactName: l.customer_name,
            phone: l.phone,
            area: l.address || "-",
            status: l.stage || "new_data",
            estimatedRevenue: 0,
            createdAt: l.updated_at || l.created_at
        }));

        return allLeads;
    } catch (err) {
        console.error("[getAdminLeads] Error:", err);
        return [];
    }
}

// Helper to get today's range if no date provided, or parse provided dates
const getDateRange = (from?: string, to?: string) => {
    // Fix Timezone Issue: 
    // "2026-01-08" -> new Date("2026-01-08") is UTC Midnight.
    // For UTC+7 (VN), this is 7AM Local. We want 00:00 Local.
    // Solution: Append T00:00:00 to force Local Time parsing.

    let start, end;

    if (from) {
        // If YYYY-MM-DD, append T00:00:00 to treat as Local Midnight
        const fromStr = from.includes('T') ? from : `${from}T00:00:00`;
        start = new Date(fromStr);
    } else {
        start = new Date('2023-01-01T00:00:00'); // Project start
    }

    if (to) {
        const toStr = to.includes('T') ? to : `${to}T00:00:00`;
        end = new Date(toStr);
        end.setHours(23, 59, 59, 999); // End of Local Day
    } else {
        end = new Date();
        end.setHours(23, 59, 59, 999);
    }

    return {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString()
    };
};

export async function getAdminLeadStats(token?: string, fromDate?: string, toDate?: string): Promise<AdminLeadStats> {
    try {
        const { p_start_date, p_end_date } = getDateRange(fromDate, toDate);

        // 1. Call RPC for aggregated sums (Fast)
        const { data: statsData, error: statsError } = await supabase
            .rpc('get_admin_dashboard_stats', { p_start_date, p_end_date });

        if (statsError) throw statsError;

        // 2. Fetch Latest Leads (Limit 10) - Sort by Last Updated
        const { data: leadsData, error: leadsError } = await supabase
            .from('crm_leads')
            .select('*')
            .order('updated_at', { ascending: false }) // Sort by updated_at
            .limit(10);

        // Map latest leads
        const latestLeads: AdminLead[] = (leadsData || []).map((l: any) => ({
            id: l.id,
            source: (['CTV', 'Sales', 'Telesales'].includes(l.source) ? l.source : 'Sales') as AdminLeadSource,
            name: l.title || l.customer_name || "Khách hàng",
            contactName: l.customer_name,
            phone: l.phone,
            area: "-",
            status: l.stage || "new_data",
            estimatedRevenue: 0,
            createdAt: l.updated_at || l.created_at
        }));

        if (statsData) {
            return {
                totalLeads: statsData.totalLeads || 0,
                totalCTVLeads: statsData.totalCTVLeads || 0,
                totalSalesLeads: statsData.totalSalesLeads || 0,
                totalTelesalesLeads: statsData.totalTelesalesLeads || 0,
                totalOrders: statsData.totalOrders || 0,
                totalEstimatedRevenue: statsData.totalEstimatedRevenue || 0,
                totalOrderRevenue: statsData.totalOrderRevenue || 0,
                totalProfit: statsData.totalProfit || 0,
                convertedLeads: statsData.convertedLeads || 0,
                latestLeads: latestLeads
            };
        }

        return {
            totalLeads: 0, totalCTVLeads: 0, totalSalesLeads: 0, totalTelesalesLeads: 0,
            totalOrders: 0, totalEstimatedRevenue: 0, totalOrderRevenue: 0, totalProfit: 0,
            convertedLeads: 0, latestLeads: []
        };

    } catch (err) {
        console.error("[getAdminLeadStats] Error:", err);
        return {
            totalLeads: 0, totalCTVLeads: 0, totalSalesLeads: 0, totalTelesalesLeads: 0,
            totalOrders: 0, totalEstimatedRevenue: 0, totalOrderRevenue: 0, totalProfit: 0,
            convertedLeads: 0, latestLeads: []
        };
    }
}

export async function getAdvancedStats(fromDate?: string, toDate?: string): Promise<{ topProducts: TopProduct[], funnel: FunnelStat[] }> {
    try {
        const { p_start_date, p_end_date } = getDateRange(fromDate, toDate);

        const [productsRes, funnelRes] = await Promise.all([
            supabase.rpc('get_top_products', { p_start_date, p_end_date, p_limit: 5 }),
            supabase.rpc('get_lead_funnel_stats', { p_start_date, p_end_date })
        ]);

        const topProducts: TopProduct[] = (productsRes.data || []).map((p: any) => ({
            productName: p.product_name,
            sku: p.sku,
            quantity: p.total_quantity,
            revenue: p.total_revenue,
            profit: p.total_profit || 0
        }));

        const funnel: FunnelStat[] = (funnelRes.data || []).map((f: any) => ({
            stage: f.stage_name,
            count: f.lead_count
        }));

        return { topProducts, funnel };

    } catch (err) {
        console.error("[getAdvancedStats] Error:", err);
        return { topProducts: [], funnel: [] };
    }
}

// Old method moved to fallback (Cleanup in future if unused)
async function getAdminLeadStatsFallback(token?: string): Promise<AdminLeadStats> {
    try {
        const [allLeads, ordersRes] = await Promise.all([
            getAdminLeads(),
            supabase.from('orders').select('total_amount,status')
        ]);

        const ordersData = ordersRes.data || [];

        const totalLeads = allLeads.length;
        const totalCTVLeads = 0;
        const totalSalesLeads = allLeads.length;
        const totalOrders = ordersData.length;
        const totalOrderRevenue = ordersData
            .filter((o: any) => o.status !== 'cancelled' && o.status !== 'draft')
            .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

        const convertedLeads = allLeads.filter(l => l.status === 'won').length;
        const latestLeads = allLeads.slice(0, 10);

        return {
            totalLeads,
            totalCTVLeads,
            totalSalesLeads,
            totalTelesalesLeads: 0, // Fallback
            totalOrders,
            totalEstimatedRevenue: 0,
            totalOrderRevenue,
            totalProfit: 0,
            convertedLeads,
            latestLeads,
        };
    } catch (e) {
        return {
            totalLeads: 0, totalCTVLeads: 0, totalSalesLeads: 0, totalTelesalesLeads: 0,
            totalOrders: 0, totalEstimatedRevenue: 0, totalOrderRevenue: 0, totalProfit: 0,
            convertedLeads: 0, latestLeads: []
        };
    }
}
