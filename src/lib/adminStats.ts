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

export function getAdminLeads(): AdminLead[] {
    const ctvLeads = loadCTVLeads();
    const salesLeads = loadSalesLeads();
    const customerOrders = getAllOrders();

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

    // Map Customer Orders to AdminLead format
    const orderAdminLeads: AdminLead[] = customerOrders.map((order: CustomerOrder) => ({
        id: `order-${order.id}`,
        source: "Customer Order" as AdminLeadSource,
        name: order.customerName,
        contactName: order.customerName,
        status: order.status,
        estimatedRevenue: order.totalAmount,
        createdAt: order.createdAt,
    }));

    // Combine and sort by createdAt descending
    const allLeads = [...ctvAdminLeads, ...salesAdminLeads, ...orderAdminLeads];
    allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return allLeads;
}

export function getAdminLeadStats(): AdminLeadStats {
    const allLeads = getAdminLeads();
    const customerOrders = getAllOrders();

    const totalLeads = allLeads.filter((l) => l.source !== "Customer Order").length;
    const totalCTVLeads = allLeads.filter((l) => l.source === "CTV").length;
    const totalSalesLeads = allLeads.filter((l) => l.source === "Sales").length;
    const totalOrders = customerOrders.length;

    const totalEstimatedRevenue = allLeads
        .filter((l) => l.source === "Sales")
        .reduce((sum, lead) => sum + (lead.estimatedRevenue || 0), 0);

    const totalOrderRevenue = customerOrders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
    );

    // Count converted leads (Sales leads with WON status)
    const convertedLeads = allLeads.filter(
        (l) => l.source === "Sales" && l.status === "WON"
    ).length;

    // Get latest 10 leads/orders
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
}
