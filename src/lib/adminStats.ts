import { loadLeads as loadCTVLeads, CtvLead } from "./ctvLeads";
import { loadSalesLeads, SalesLead } from "./salesLeads";

export type AdminLeadSource = "CTV" | "Sales";

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
    totalEstimatedRevenue: number;
    convertedLeads: number;
    latestLeads: AdminLead[];
}

export function getAdminLeads(): AdminLead[] {
    const ctvLeads = loadCTVLeads();
    const salesLeads = loadSalesLeads();

    // Map CTV leads to AdminLead format
    const ctvAdminLeads: AdminLead[] = ctvLeads.map((lead: CtvLead) => ({
        id: `ctv-${lead.id}`,
        source: "CTV" as AdminLeadSource,
        name: lead.storeName,
        contactName: lead.contactName,
        phone: lead.phone,
        area: lead.area,
        status: lead.status,
        estimatedRevenue: 0,
        createdAt: lead.createdAt,
    }));

    // Map Sales leads to AdminLead format
    const salesAdminLeads: AdminLead[] = salesLeads.map((lead: SalesLead) => ({
        id: `sales-${lead.id}`,
        source: "Sales" as AdminLeadSource,
        name: lead.storeName,
        contactName: lead.contactName,
        phone: lead.phone,
        area: lead.area,
        status: lead.status,
        estimatedRevenue: lead.estimatedRevenue,
        createdAt: lead.createdAt,
    }));

    // Combine and sort by createdAt descending
    const allLeads = [...ctvAdminLeads, ...salesAdminLeads];
    allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return allLeads;
}

export function getAdminLeadStats(): AdminLeadStats {
    const allLeads = getAdminLeads();

    const totalLeads = allLeads.length;
    const totalCTVLeads = allLeads.filter((l) => l.source === "CTV").length;
    const totalSalesLeads = allLeads.filter((l) => l.source === "Sales").length;

    const totalEstimatedRevenue = allLeads.reduce(
        (sum, lead) => sum + (lead.estimatedRevenue || 0),
        0
    );

    // Count converted leads (Sales leads with WON status)
    const convertedLeads = allLeads.filter(
        (l) => l.source === "Sales" && l.status === "WON"
    ).length;

    // Get latest 10 leads
    const latestLeads = allLeads.slice(0, 10);

    return {
        totalLeads,
        totalCTVLeads,
        totalSalesLeads,
        totalEstimatedRevenue,
        convertedLeads,
        latestLeads,
    };
}
