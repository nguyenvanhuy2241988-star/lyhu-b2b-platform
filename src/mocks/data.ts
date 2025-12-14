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

export const mockProducts: Product[] = [
    {
        id: "uhi-cola",
        sku: "UHI-001",
        name: "UHI Que chua vị Cola",
        brand: "UHI",
        unit: "goi",
        packSize: 24,
        wholesalePrice: 16000,
        basePrice: 16000,
        customerPrice: 20000,
        ctvSelfShipPrice: 14000,
        basePricePerUnit: 16000,
        customerPriceTiers: [
            { minQty: 1, maxQty: 11, pricePerUnit: 20000 },
            { minQty: 12, maxQty: 47, pricePerUnit: 18000 },
            { minQty: 48, pricePerUnit: 16000 },
        ],
        ctvSelfShipPriceTiers: [
            { minQty: 1, maxQty: 23, pricePerUnit: 14000 },
            { minQty: 24, maxQty: 71, pricePerUnit: 13000 },
            { minQty: 72, pricePerUnit: 12000 },
        ],
        ctvCommissionRate: 0.1,
    },
    {
        id: "boyo-popcorn-set",
        sku: "BOYO-001",
        name: "BOYO Set nổ bỏng ngô 3in1",
        brand: "BOYO",
        unit: "set",
        packSize: 12,
        wholesalePrice: 50000,
        basePrice: 50000,
        customerPrice: 60000,
        ctvSelfShipPrice: 45000,
        basePricePerUnit: 50000,
        customerPriceTiers: [
            { minQty: 1, maxQty: 5, pricePerUnit: 60000 },
            { minQty: 6, maxQty: 23, pricePerUnit: 55000 },
            { minQty: 24, pricePerUnit: 50000 },
        ],
        ctvSelfShipPriceTiers: [
            { minQty: 1, maxQty: 11, pricePerUnit: 45000 },
            { minQty: 12, maxQty: 35, pricePerUnit: 43000 },
            { minQty: 36, pricePerUnit: 41000 },
        ],
        ctvCommissionRate: 0.08,
    },
    {
        id: "cvt-salted-egg",
        sku: "CVT-001",
        name: "CVT Khoai môn trứng muối",
        brand: "CVT",
        unit: "goi",
        packSize: 24,
        wholesalePrice: 34000,
        basePrice: 34000,
        customerPrice: 40000,
        ctvSelfShipPrice: 30000,
        basePricePerUnit: 34000,
        customerPriceTiers: [
            { minQty: 1, maxQty: 9, pricePerUnit: 40000 },
            { minQty: 10, maxQty: 47, pricePerUnit: 37000 },
            { minQty: 48, pricePerUnit: 34000 },
        ],
        ctvSelfShipPriceTiers: [
            { minQty: 1, maxQty: 23, pricePerUnit: 30000 },
            { minQty: 24, maxQty: 71, pricePerUnit: 29000 },
            { minQty: 72, pricePerUnit: 28000 },
        ],
        ctvCommissionRate: 0.09,
    },
    {
        id: "4",
        sku: "LYHU-001",
        name: "Trà xanh LYHU Premium 450ml",
        brand: "LYHU",
        unit: "Chai",
        wholesalePrice: 7000,
        basePrice: 6500,
        customerPrice: 9000,
        ctvSelfShipPrice: 6800,
        ctvCommissionRate: 0.12,
        basePricePerUnit: 6500,
        customerPriceTiers: [{ minQty: 1, pricePerUnit: 9000 }],
        ctvSelfShipPriceTiers: [{ minQty: 1, pricePerUnit: 6800 }],
    },
    {
        id: "5",
        sku: "UHI-002",
        name: "Nước tăng lực UHI Plus 500ml",
        brand: "UHI",
        unit: "Lon",
        wholesalePrice: 12000,
        basePrice: 11000,
        customerPrice: 15000,
        ctvSelfShipPrice: 11500,
        ctvCommissionRate: 0.08,
        basePricePerUnit: 11000,
        customerPriceTiers: [{ minQty: 1, pricePerUnit: 15000 }],
        ctvSelfShipPriceTiers: [{ minQty: 1, pricePerUnit: 11500 }],
    },
    {
        id: "6",
        sku: "BOYO-002",
        name: "Sữa chua uống BOYO Việt Quất 180ml",
        brand: "BOYO",
        unit: "Chai",
        wholesalePrice: 6500,
        basePrice: 6000,
        customerPrice: 8000,
        ctvSelfShipPrice: 6300,
        ctvCommissionRate: 0.10,
        basePricePerUnit: 6000,
        customerPriceTiers: [{ minQty: 1, pricePerUnit: 8000 }],
        ctvSelfShipPriceTiers: [{ minQty: 1, pricePerUnit: 6300 }],
    },
    {
        id: "7",
        sku: "CVT-002",
        name: "Nước khoáng CVT 1.5L",
        brand: "CVT",
        unit: "Chai",
        wholesalePrice: 7500,
        basePrice: 7000,
        customerPrice: 9000,
        ctvSelfShipPrice: 7200,
        ctvCommissionRate: 0.15,
        basePricePerUnit: 7000,
        customerPriceTiers: [{ minQty: 1, pricePerUnit: 9000 }],
        ctvSelfShipPriceTiers: [{ minQty: 1, pricePerUnit: 7200 }],
    },
    {
        id: "8",
        sku: "LYHU-002",
        name: "Trà đào LYHU Deluxe 450ml",
        brand: "LYHU",
        unit: "Chai",
        wholesalePrice: 8000,
        basePrice: 7500,
        customerPrice: 10000,
        ctvSelfShipPrice: 7800,
        ctvCommissionRate: 0.12,
        basePricePerUnit: 7500,
        customerPriceTiers: [{ minQty: 1, pricePerUnit: 10000 }],
        ctvSelfShipPriceTiers: [{ minQty: 1, pricePerUnit: 7800 }],
    },
];

export const mockCart: CartItem[] = [
    {
        id: "1",
        product: mockProducts[0],
        quantity: 10,
    },
    {
        id: "2",
        product: mockProducts[1],
        quantity: 5,
    },
    {
        id: "3",
        product: mockProducts[2],
        quantity: 20,
    },
];

export const mockOrders: CustomerOrder[] = [
    {
        id: "1",
        orderNumber: "ORD-2024-001",
        customerId: "3",
        customerName: "Lê Văn Cường",
        items: [
            { productId: "1", productName: "Nước tăng lực UHI Energy 330ml", quantity: 20, price: 8500 },
            { productId: "2", productName: "Sữa chua uống BOYO Dâu 180ml", quantity: 10, price: 6000 },
        ],
        totalAmount: 230000,
        status: "pending",
        createdAt: "2024-11-25",
        source: "CUSTOMER",
    },
    {
        id: "2",
        orderNumber: "ORD-2024-002",
        customerId: "3",
        customerName: "Lê Văn Cường",
        items: [
            { productId: "3", productName: "Nước khoáng CVT 500ml", quantity: 50, price: 3000 },
            { productId: "4", productName: "Trà xanh LYHU Premium 450ml", quantity: 15, price: 7000 },
        ],
        totalAmount: 255000,
        status: "processing",
        createdAt: "2024-11-20",
        deliveryDate: "2024-11-22",
        source: "CUSTOMER",
    },
    {
        id: "3",
        orderNumber: "ORD-2024-003",
        customerId: "3",
        customerName: "Lê Văn Cường",
        items: [
            { productId: "5", productName: "Nước tăng lực UHI Plus 500ml", quantity: 8, price: 12000 },
        ],
        totalAmount: 96000,
        status: "delivered",
        createdAt: "2024-11-15",
        deliveryDate: "2024-11-18",
        source: "CUSTOMER",
    },
    {
        id: "4",
        orderNumber: "ORD-2024-004",
        customerId: "3",
        customerName: "Lê Văn Cường",
        items: [
            { productId: "6", productName: "Sữa chua uống BOYO Việt Quất 180ml", quantity: 12, price: 6500 },
            { productId: "7", productName: "Nước khoáng CVT 1.5L", quantity: 6, price: 7500 },
        ],
        totalAmount: 123000,
        status: "cancelled",
        createdAt: "2024-11-10",
        source: "CUSTOMER",
    },
    {
        id: "5",
        orderNumber: "ORD-2024-005",
        customerId: "3", // Same customer for demo
        customerName: "Lê Văn Cường",
        items: [
            { productId: "5", productName: "Nước tăng lực UHI Plus 500ml", quantity: 20, price: 12000 },
        ],
        totalAmount: 240000,
        status: "delivered",
        createdAt: "2024-11-25",
        fulfillmentMode: "LYHU_SHIP",
        ctvId: "101", // Junior 1
        ctvName: "CTV Junior 1",
        ctvCommission: 24000,
        // Referral linkage
        ctvReferralCode: "JUNIOR1",
        ctvReferredByCode: "DUNGPHAM88",
        source: "CTV",
    },
    {
        id: "FRAUD-TEST-1",
        orderNumber: "ORD-2024-999",
        customerId: "3",
        customerName: "Gian Lận",
        items: [
            { productId: "5", productName: "Nước tăng lực UHI Plus 500ml", quantity: 50, price: 12000 },
        ],
        totalAmount: 600000,
        status: "pending",
        createdAt: "2024-12-09",
        source: "CTV",
        ctvId: "4", // DUNGPHAM88
        ctvCommission: 48000,
        fulfillmentMode: "LYHU_SHIP",
        receiverPhone: "0961234567", // Matches DUNGPHAM88's phone (set below in mockUsers)
        receiverAddress: "123 Đường Cầu Giấy, Hà Nội",
    },
    // Telesales Orders
    {
        id: "TS-ORD-1",
        orderNumber: "ORD-TS-001",
        customerId: "TS-CUST-1",
        customerName: "Tạp hóa Minh Tâm",
        items: [
            { productId: "4", productName: "Trà xanh LYHU Premium 450ml", quantity: 50, price: 6500 },
        ],
        totalAmount: 325000,
        status: "confirmed",
        createdAt: new Date().toISOString().split('T')[0], // Today
        source: "TELESALES",
    },
    {
        id: "TS-ORD-2",
        orderNumber: "ORD-TS-002",
        customerId: "TS-CUST-2",
        customerName: "Siêu thị Bình Minh",
        items: [
            { productId: "5", productName: "Nước tăng lực UHI Plus 500ml", quantity: 100, price: 11000 },
        ],
        totalAmount: 1100000,
        status: "pending",
        createdAt: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        source: "TELESALES",
    },
    {
        id: "TS-ORD-3",
        orderNumber: "ORD-TS-003",
        customerId: "TS-CUST-3",
        customerName: "Đại lý Hùng Cường",
        items: [
            { productId: "1", productName: "UHI Que chua vị Cola", quantity: 240, price: 14000 },
        ],
        totalAmount: 3360000,
        status: "delivered",
        createdAt: "2024-12-10",
        source: "TELESALES",
    },
];

export const mockLeads: Lead[] = [
    {
        id: "1",
        storeName: "Tạp hóa Ngọc Lan",
        contactPerson: "Chị Lan",
        phone: "0912345678",
        area: "Hà Đông, Hà Nội",
        type: "Tạp hóa",
        status: "new",
        notes: "Quan tâm sản phẩm nước giải khát",
        createdAt: "2024-11-29",
        ctvId: "4",
        ctvName: "Phạm Thị Dung",
    },
    {
        id: "2",
        storeName: "Mini Mart Hương Mai",
        contactPerson: "Anh Tuấn",
        phone: "0923456789",
        area: "Thanh Xuân, Hà Nội",
        type: "Mini mart",
        status: "contacted",
        notes: "Đã gọi điện, hẹn gặp tuần sau",
        createdAt: "2024-11-27",
        ctvId: "4",
        ctvName: "Phạm Thị Dung",
    },
    {
        id: "3",
        storeName: "Đại lý Hoàng Gia",
        contactPerson: "Anh Hoàng",
        phone: "0934567890",
        area: "Cầu Giấy, Hà Nội",
        type: "Đại lý",
        status: "converted",
        notes: "Đã ký hợp đồng, chuyển sang Sales",
        createdAt: "2024-11-25",
        ctvId: "4",
        ctvName: "Phạm Thị Dung",
    },
    {
        id: "4",
        storeName: "Tạp hóa Phương Anh",
        contactPerson: "Chị Phương",
        phone: "0945678901",
        area: "Đống Đa, Hà Nội",
        type: "Tạp hóa",
        status: "new",
        notes: "Gặp trực tiếp tại cửa hàng",
        createdAt: "2024-11-28",
        ctvId: "4",
        ctvName: "Phạm Thị Dung",
    },
    {
        id: "5",
        storeName: "NPP Miền Bắc",
        contactPerson: "Anh Minh",
        phone: "0956789012",
        area: "Long Biên, Hà Nội",
        type: "NPP",
        status: "contacted",
        notes: "Đang đàm phán điều khoản",
        createdAt: "2024-11-26",
        ctvId: "4",
        ctvName: "Phạm Thị Dung",
    },
    // Telesales Leads
    {
        id: "TS-LEAD-1",
        storeName: "Tạp hóa Cô Lan",
        contactPerson: "Cô Lan",
        phone: "0998887771",
        area: "Thanh Xuân, Hà Nội",
        type: "Tạp hóa",
        status: "new",
        notes: "Khách quan tâm SP mới, cần gọi lại chiều nay",
        createdAt: new Date().toISOString(),
        ctvId: "",
        ctvName: "",
        channel: "TELESALES",
        assignedToRole: "TELESALES",
    },
    {
        id: "TS-LEAD-2",
        storeName: "Mart 24h",
        contactPerson: "Anh Hùng",
        phone: "0998887772",
        area: "Hoàng Mai, Hà Nội",
        type: "Mini mart",
        status: "contacted",
        notes: "Đã giới thiệu, cần gửi báo giá",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        ctvId: "",
        ctvName: "",
        channel: "TELESALES",
        assignedToRole: "TELESALES",
    },
    {
        id: "TS-LEAD-3",
        storeName: "Đại lý Bia Nước Ngọt Tuấn Tú",
        contactPerson: "Anh Tuấn",
        phone: "0998887773",
        area: "Cầu Giấy, Hà Nội",
        type: "Đại lý",
        status: "new",
        notes: "Lead từ Marketing đổ về",
        createdAt: new Date().toISOString(),
        ctvId: "",
        ctvName: "",
        channel: "TELESALES",
        assignedToRole: "TELESALES",
    },
    {
        id: "TS-LEAD-4",
        storeName: "Căng tin ĐH Quốc Gia",
        contactPerson: "Chị Mai",
        phone: "0998887774",
        area: "Cầu Giấy, Hà Nội",
        type: "Tạp hóa",
        status: "converted",
        notes: "Đã lên đơn 5 thùng nước",
        createdAt: "2024-12-10",
        ctvId: "",
        ctvName: "",
        channel: "TELESALES",
        assignedToRole: "TELESALES",
    },
    {
        id: "TS-LEAD-5",
        storeName: "Tạp hóa Bác Ba",
        contactPerson: "Bác Ba",
        phone: "0998887775",
        area: "Hà Đông, Hà Nội",
        type: "Tạp hóa",
        status: "new",
        notes: "Số máy bận, gọi lại sau",
        createdAt: new Date().toISOString(),
        ctvId: "",
        ctvName: "",
        channel: "TELESALES",
        assignedToRole: "TELESALES",
    },
];

export const mockCustomers: Customer[] = [
    {
        id: "1",
        storeName: "Tạp hóa Hương Mai",
        type: "Tạp hóa",
        area: "Hà Đông, Hà Nội",
        phone: "0912345678",
        email: "huongmai@gmail.com",
        address: "123 Nguyễn Trãi, Hà Đông",
    },
    {
        id: "2",
        storeName: "Mini Mart Phương Anh",
        type: "Mini mart",
        area: "Thanh Xuân, Hà Nội",
        phone: "0923456789",
        email: "phuonganh@gmail.com",
        address: "456 Nguyễn Xiển, Thanh Xuân",
    },
    {
        id: "3",
        storeName: "Đại lý Hoàng Long",
        type: "Đại lý",
        area: "Cầu Giấy, Hà Nội",
        phone: "0934567890",
        email: "hoanglong@gmail.com",
        address: "789 Trần Thái Tông, Cầu Giấy",
    },
    {
        id: "4",
        storeName: "NPP Miền Bắc",
        type: "NPP",
        area: "Long Biên, Hà Nội",
        phone: "0945678901",
        email: "nppmienbac@gmail.com",
        address: "321 Ngọc Lâm, Long Biên",
    },
    {
        id: "5",
        storeName: "Tạp hóa Ngọc Lan",
        type: "Tạp hóa",
        area: "Ba Đình, Hà Nội",
        phone: "0956789012",
        address: "654 Kim Mã, Ba Đình",
    },
    {
        id: "6",
        storeName: "Mini Mart Sao Việt",
        type: "Mini mart",
        area: "Đống Đa, Hà Nội",
        phone: "0967890123",
        email: "saoviet@gmail.com",
        address: "987 Tây Sơn, Đống Đa",
    },
];

export const mockUsers: User[] = [
    {
        id: "1",
        name: "Admin LYHU",
        email: "admin@lyhu.vn",
        role: "admin",
        status: "active",
        createdAt: "2024-01-01",
    },
    {
        id: "2",
        name: "Sales LYHU",
        email: "sales@lyhu.vn",
        role: "sales",
        status: "active",
        createdAt: "2024-01-15",
    },
    {
        id: "3",
        name: "Lê Văn Cường",
        email: "cuong.le@lyhu.vn",
        role: "customer",
        status: "active",
        createdAt: "2024-02-01",
    },
    {
        id: "4",
        name: "Phạm Thị Dung",
        email: "dung.pham@lyhu.vn",
        role: "ctv",
        status: "active",
        createdAt: "2024-02-15",
        // Completed Profile
        phone: "0961234567",
        address: "123 Đường Cầu Giấy",
        province: "Hà Nội",
        region: "Miền Bắc",
        referralCode: "DUNGPHAM88",
        ctvType: "Community Leader",
        ctvMode: "Self-Ship",
        onboardingStep: 3,
    },
    {
        id: "99",
        name: "CTV Mới Bắt Đầu",
        email: "ctv.new@lyhu.vn",
        role: "ctv",
        status: "active",
        createdAt: "2024-12-01",
        // Incomplete Profile
        phone: "",
        address: "",
        province: "",
        region: "",
        referralCode: "CTVNEW001",
        onboardingStep: 0,
    },
    {
        id: "5",
        name: "Nguyễn Văn An",
        email: "an.nguyen@lyhu.vn",
        role: "sales",
        status: "inactive",
        createdAt: "2024-03-01",
    },
    {
        id: "101",
        name: "CTV Junior 1 (Đã kích hoạt)",
        email: "junior1@lyhu.vn",
        role: "ctv",
        status: "active",
        createdAt: "2024-11-20",
        phone: "0971112222",
        address: "Thanh Xuân, HN",
        province: "Hà Nội",
        region: "Miền Bắc",
        referralCode: "JUNIOR1",
        ctvType: "Indie",
        ctvMode: "No-Capital",
        onboardingStep: 3,
        // Linked to DUNGPHAM88
        referredByCode: "DUNGPHAM88",
        referredByCtvId: "4",
        activatedAt: "2024-11-25T10:00:00Z", // Activated
    },
    {
        id: "102",
        name: "CTV Junior 2 (Mới)",
        email: "junior2@lyhu.vn",
        role: "ctv",
        status: "active",
        createdAt: "2024-12-05",
        phone: "0973334444",
        address: "Hà Đông, HN",
        province: "Hà Nội",
        region: "Miền Bắc",
        referralCode: "JUNIOR2",
        ctvType: "Indie",
        ctvMode: "No-Capital",
        onboardingStep: 3,
        // Linked to DUNGPHAM88
        referredByCode: "DUNGPHAM88",
        referredByCtvId: "4",
        activatedAt: null, // Not activated yet
    },
    // Telesales User
    {
        id: "teslesale-user-1",
        name: "Nhân viên Telesales 1",
        email: "telesales1@lyhu.vn",
        role: "telesales",
        status: "active",
        createdAt: "2024-12-01",
    },
];
