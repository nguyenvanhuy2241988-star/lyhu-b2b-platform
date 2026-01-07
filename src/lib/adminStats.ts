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

import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();

// ... existing interfaces ...

export async function getAdminLeads(): Promise<AdminLead[]> {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const allLeads: AdminLead[] = (data || []).map((l: any) => ({
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

        return allLeads;
    } catch (err) {
        console.error("[getAdminLeads] Error:", err);
        return [];
    }
}

// Helper ... (getDateRange)

export async function getAdminLeadStats(token?: string, fromDate?: string, toDate?: string): Promise<AdminLeadStats> {
    try {
        const { p_start_date, p_end_date } = getDateRange(fromDate, toDate);

        // 1. Call RPC for aggregated sums (Fast)
        const { data: statsData, error: statsError } = await supabase
            .rpc('get_admin_dashboard_stats', { p_start_date, p_end_date });

        if (statsError) throw statsError;

        // 2. Fetch Latest Leads (Limit 10) - Separate fast query
        const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

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
                totalEstimatedRevenue: statsData.totalEstimatedRevenue || 0,
                totalOrderRevenue: statsData.totalOrderRevenue || 0,
                convertedLeads: statsData.convertedLeads || 0,
                latestLeads: latestLeads
            };
        }

        return {
            totalLeads: 0, totalCTVLeads: 0, totalSalesLeads: 0, totalOrders: 0,
            totalEstimatedRevenue: 0, totalOrderRevenue: 0, convertedLeads: 0, latestLeads: []
        };

    } catch (err) {
        console.error("[getAdminLeadStats] Error:", err);
        return {
            totalLeads: 0, totalCTVLeads: 0, totalSalesLeads: 0, totalOrders: 0,
            totalEstimatedRevenue: 0, totalOrderRevenue: 0, convertedLeads: 0, latestLeads: []
        };
    }
}

// Old method moved to fallback
// Old method moved to fallback
async function getAdminLeadStatsFallback(token?: string): Promise<AdminLeadStats> {
    try {
        const [allLeads, ordersRes] = await Promise.all([
            getAdminLeads(), // Fixed: No token argument needed
            supabase.from('orders').select('total_amount,status') // Fixed: Use Supabase client
        ]);

        const ordersData = ordersRes.data || [];

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
