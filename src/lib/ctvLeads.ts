export type LeadStatus = "NEW" | "CONTACTED" | "CONVERTED";

export interface CtvLead {
    id: string;
    storeName: string;
    contactName: string;
    phone: string;
    area: string;
    customerType: string;
    note?: string;
    status: LeadStatus;
    createdAt: string;
}

const STORAGE_KEY = "LYHU_CTV_LEADS_V1";

// Default leads based on existing mock data
function getDefaultLeads(): CtvLead[] {
    return [
        {
            id: "1",
            storeName: "Tạp hóa Ngọc Lan",
            contactName: "Chị Lan",
            phone: "0912345678",
            area: "Hà Đông, Hà Nội",
            customerType: "Tạp hóa",
            status: "NEW",
            note: "Quan tâm sản phẩm nước giải khát",
            createdAt: "2024-11-29T00:00:00.000Z",
        },
        {
            id: "2",
            storeName: "Mini Mart Hương Mai",
            contactName: "Anh Tuấn",
            phone: "0923456789",
            area: "Thanh Xuân, Hà Nội",
            customerType: "Mini mart",
            status: "CONTACTED",
            note: "Đã gọi điện, hẹn gặp tuần sau",
            createdAt: "2024-11-27T00:00:00.000Z",
        },
        {
            id: "3",
            storeName: "Đại lý Hoàng Gia",
            contactName: "Anh Hoàng",
            phone: "0934567890",
            area: "Cầu Giấy, Hà Nội",
            customerType: "Đại lý",
            status: "CONVERTED",
            note: "Đã ký hợp đồng, chuyển sang Sales",
            createdAt: "2024-11-25T00:00:00.000Z",
        },
        {
            id: "4",
            storeName: "Tạp hóa Phương Anh",
            contactName: "Chị Phương",
            phone: "0945678901",
            area: "Đống Đa, Hà Nội",
            customerType: "Tạp hóa",
            status: "NEW",
            note: "Gặp trực tiếp tại cửa hàng",
            createdAt: "2024-11-28T00:00:00.000Z",
        },
        {
            id: "5",
            storeName: "NPP Miền Bắc",
            contactName: "Anh Minh",
            phone: "0956789012",
            area: "Long Biên, Hà Nội",
            customerType: "NPP",
            status: "CONTACTED",
            note: "Đang đàm phán điều khoản",
            createdAt: "2024-11-26T00:00:00.000Z",
        },
    ];
}

export function loadLeads(): CtvLead[] {
    if (typeof window === "undefined") return getDefaultLeads();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultLeads();
    try {
        const parsed = JSON.parse(raw) as CtvLead[];
        if (!Array.isArray(parsed)) return getDefaultLeads();
        return parsed;
    } catch {
        return getDefaultLeads();
    }
}

export function saveLeads(leads: CtvLead[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export interface NewLeadInput {
    storeName: string;
    contactName: string;
    phone: string;
    area: string;
    customerType: string;
    note?: string;
}

export function addLead(input: NewLeadInput): CtvLead {
    const current = loadLeads();
    const newLead: CtvLead = {
        id: Date.now().toString(),
        ...input,
        status: "NEW",
        createdAt: new Date().toISOString(),
    };
    const updated = [newLead, ...current];
    saveLeads(updated);
    return newLead;
}

export function updateLeadStatus(id: string, status: LeadStatus): CtvLead[] {
    const current = loadLeads();
    const updated = current.map((lead) =>
        lead.id === id ? { ...lead, status } : lead
    );
    saveLeads(updated);
    return updated;
}

export function getLeadStats(leads: CtvLead[]) {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === "NEW").length;
    const contactedCount = leads.filter((l) => l.status === "CONTACTED").length;
    const convertedCount = leads.filter((l) => l.status === "CONVERTED").length;
    return { total, newCount, contactedCount, convertedCount };
}
