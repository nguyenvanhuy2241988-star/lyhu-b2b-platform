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
    note?: string;
    email?: string;
    address?: string;
    createdAt: string;
}

export interface SalesStats {
    total: number;
    inProgress: number;
    won: number;
    estimatedRevenue: number;
}

const STORAGE_KEY = "lyhu_sales_leads_v1";

function getDefaultSalesLeads(): SalesLead[] {
    return [
        {
            id: "1",
            storeName: "Siêu thị Mini Mart Plus",
            contactName: "Anh Tuấn",
            phone: "0901234567",
            area: "Quận 1, TP.HCM",
            type: "Mini mart",
            status: "IN_PROGRESS",
            estimatedRevenue: 15000000,
            note: "Đang đàm phán hợp đồng dài hạn",
            createdAt: "2024-11-28T00:00:00.000Z",
        },
        {
            id: "2",
            storeName: "NPP Hoàng Gia",
            contactName: "Chị Lan",
            phone: "0912345678",
            area: "Bình Dương",
            type: "NPP",
            status: "WON",
            estimatedRevenue: 50000000,
            note: "Đã ký hợp đồng 6 tháng",
            createdAt: "2024-11-25T00:00:00.000Z",
        },
        {
            id: "3",
            storeName: "Tạp hóa Phương Nam",
            contactName: "Anh Minh",
            phone: "0923456789",
            area: "Quận 3, TP.HCM",
            type: "Tạp hóa",
            status: "NEW",
            estimatedRevenue: 8000000,
            note: "Mới tiếp cận, chưa liên hệ",
            createdAt: "2024-11-29T00:00:00.000Z",
        },
        {
            id: "4",
            storeName: "Đại lý Minh Khang",
            contactName: "Chị Hương",
            phone: "0934567890",
            area: "Đồng Nai",
            type: "Đại lý",
            status: "CONTACTED",
            estimatedRevenue: 25000000,
            note: "Đã gọi điện, hẹn gặp tuần sau",
            createdAt: "2024-11-27T00:00:00.000Z",
        },
        {
            id: "5",
            storeName: "Siêu thị Sài Gòn Co.op",
            contactName: "Anh Đức",
            phone: "0945678901",
            area: "Quận 7, TP.HCM",
            type: "Siêu thị",
            status: "LOST",
            estimatedRevenue: 30000000,
            note: "Đã chọn nhà cung cấp khác",
            createdAt: "2024-11-20T00:00:00.000Z",
        },
    ];
}

export function loadSalesLeads(): SalesLead[] {
    if (typeof window === "undefined") return getDefaultSalesLeads();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSalesLeads();
    try {
        const parsed = JSON.parse(raw) as SalesLead[];
        if (!Array.isArray(parsed)) return getDefaultSalesLeads();
        return parsed;
    } catch {
        return getDefaultSalesLeads();
    }
}

export function saveSalesLeads(leads: SalesLead[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function addSalesLead(input: Omit<SalesLead, "id" | "createdAt">): SalesLead[] {
    const current = loadSalesLeads();
    const newLead: SalesLead = {
        id: Date.now().toString(),
        ...input,
        status: input.status || "NEW",
        createdAt: new Date().toISOString(),
    };
    const updated = [newLead, ...current];
    saveSalesLeads(updated);
    return updated;
}

export function updateSalesLeadStatus(id: string, status: SalesLeadStatus): SalesLead[] {
    const current = loadSalesLeads();
    const updated = current.map((lead) =>
        lead.id === id ? { ...lead, status } : lead
    );
    saveSalesLeads(updated);
    return updated;
}

export function getSalesStats(leads: SalesLead[]): SalesStats {
    const total = leads.length;
    const inProgress = leads.filter(
        (l) => l.status === "CONTACTED" || l.status === "IN_PROGRESS"
    ).length;
    const won = leads.filter((l) => l.status === "WON").length;
    const estimatedRevenue = leads.reduce((sum, lead) => sum + lead.estimatedRevenue, 0);

    return { total, inProgress, won, estimatedRevenue };
}
