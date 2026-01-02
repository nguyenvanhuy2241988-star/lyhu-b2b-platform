export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "customer" | "sales" | "ctv" | "telesales";
    status: "active" | "inactive";
    createdAt: string;
    // Extended properties for CTV
    phone?: string;
    address?: string;
    province?: string;
    region?: string;
    referralCode?: string;
    ctvType?: "Indie" | "Community Leader" | "KOL";
    ctvMode?: "Self-Ship" | "No-Capital";
    onboardingStep?: number; // 0-3
    // Linked Account info
    referredByCode?: string;
    referredByCtvId?: string;
    activatedAt?: string | null;
}

export interface CartItem {
    id: string;
    product: Product;
    quantity: number;
    // ... possibly other fields, kept minimal for mock
}

export interface CustomerOrder {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    status: "pending" | "processing" | "delivered" | "cancelled";
    createdAt: string;
    deliveryDate?: string;
    fulfillmentMode?: "LYHU_SHIP" | "SELF_SHIP";
    ctvId?: string;
    ctvName?: string;
    ctvCommission?: number;
    ctvReferralCode?: string;
    ctvReferredByCode?: string;
    fraudStatus?: "NONE" | "FLAGGED" | "CONFIRMED";
    flagged?: boolean;
    flaggedReasons?: string[];
    reviewedByAdminAt?: string;
    reviewedByAdminNote?: string;

    // Fraud check extras
    source?: "CUSTOMER" | "SALES" | "CTV" | "TELESALES";
    receiverPhone?: string;
    receiverAddress?: string;
}

export interface Lead {
    id: string;
    storeName: string;
    contactPerson: string;
    phone: string;
    area: string;
    type: "Tạp hóa" | "Mini mart" | "Đại lý" | "NPP";
    status: "new" | "contacted" | "converted";
    notes?: string;
    createdAt: string;
    ctvId: string;
    ctvName: string;
    // Telesales fields
    channel?: "TELESALES" | "FIELD";
    assignedToRole?: "TELESALES" | "SALE";
}

export interface Customer {
    id: string;
    storeName: string;
    type: "Tạp hóa" | "Mini mart" | "Đại lý" | "NPP";
    area: string;
    phone: string;
    email?: string;
    address?: string;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    brand: string;
    unit: string;
    wholesalePrice: number; // Deprecated
    retailPrice?: number;   // Deprecated
    stock?: number;

    // New fields for Flexible Pricing
    packSize?: number;
    basePricePerUnit: number;

    // Customer Price Tiers (LYHU Ship)
    customerPriceTiers: {
        minQty: number;
        maxQty?: number;
        pricePerUnit: number;
    }[];

    // CTV Self Ship Price Tiers
    ctvSelfShipPriceTiers: {
        minQty: number;
        maxQty?: number;
        pricePerUnit: number;
    }[];

    ctvCommissionRate: number;

    // Deprecated fields mapped for backward compatibility
    basePrice: number;
    customerPrice: number;
    ctvSelfShipPrice: number;
}

export const mockProducts: Product[] = [];

export const mockCart: CartItem[] = [];

export const mockOrders: CustomerOrder[] = [];

export const mockLeads: Lead[] = [];

export const mockCustomers: Customer[] = [];

export const mockUsers: User[] = [
    {
        id: "1",
        name: "Admin LYHU",
        email: "admin@lyhu.vn",
        role: "admin",
        status: "active",
        createdAt: "2024-01-01",
    }
];
