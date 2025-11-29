export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "customer" | "sales" | "ctv";
    status: "active" | "inactive";
    createdAt: string;
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
    wholesalePrice: number;
    retailPrice?: number;
    stock?: number;
}

export interface CartItem {
    id: string;
    product: Product;
    quantity: number;
}

export interface CustomerOrder {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    status: "pending" | "processing" | "delivered" | "cancelled";
    createdAt: string;
    deliveryDate?: string;
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
}

export const mockUsers: User[] = [
    {
        id: "1",
        name: "Nguyễn Văn An",
        email: "an.nguyen@lyhu.com",
        role: "admin",
        status: "active",
        createdAt: "2024-01-15",
    },
    {
        id: "2",
        name: "Trần Thị Bình",
        email: "binh.tran@lyhu.com",
        role: "sales",
        status: "active",
        createdAt: "2024-02-20",
    },
    {
        id: "3",
        name: "Lê Văn Cường",
        email: "cuong.le@gmail.com",
        role: "customer",
        status: "active",
        createdAt: "2024-03-10",
    },
    {
        id: "4",
        name: "Phạm Thị Dung",
        email: "dung.pham@lyhu.com",
        role: "ctv",
        status: "active",
        createdAt: "2024-04-05",
    },
    {
        id: "5",
        name: "Hoàng Văn Em",
        email: "em.hoang@gmail.com",
        role: "customer",
        status: "inactive",
        createdAt: "2024-05-12",
    },
];

export const mockCustomers: Customer[] = [
    {
        id: "1",
        storeName: "Tạp hóa Hùng Vương",
        type: "Tạp hóa",
        area: "Quận 1, TP.HCM",
        phone: "0901234567",
        email: "hungvuong@gmail.com",
        address: "123 Lê Lợi, Quận 1",
    },
    {
        id: "2",
        storeName: "Mini Mart Sài Gòn",
        type: "Mini mart",
        area: "Quận 3, TP.HCM",
        phone: "0902345678",
        email: "minimart.sg@gmail.com",
        address: "456 Võ Văn Tần, Quận 3",
    },
    {
        id: "3",
        storeName: "Đại lý Minh Khang",
        type: "Đại lý",
        area: "Quận 5, TP.HCM",
        phone: "0903456789",
        email: "minhkhang@gmail.com",
        address: "789 An Dương Vương, Quận 5",
    },
    {
        id: "4",
        storeName: "NPP Phương Nam",
        type: "NPP",
        area: "Bình Dương",
        phone: "0904567890",
        email: "phuongnam.npp@gmail.com",
        address: "321 Đại Lộ Bình Dương, Bình Dương",
    },
    {
        id: "5",
        storeName: "Tạp hóa Bách Hoá Xanh",
        type: "Tạp hóa",
        area: "Quận 7, TP.HCM",
        phone: "0905678901",
        email: "bhx@gmail.com",
        address: "654 Nguyễn Hữu Thọ, Quận 7",
    },
    {
        id: "6",
        storeName: "Mini Mart GS25",
        type: "Mini mart",
        area: "Quận 2, TP.HCM",
        phone: "0906789012",
        email: "gs25@gmail.com",
        address: "987 Trần Não, Quận 2",
    },
    {
        id: "7",
        storeName: "Đại lý Thành Đạt",
        type: "Đại lý",
        area: "Đồng Nai",
        phone: "0907890123",
        email: "thanhdat@gmail.com",
        address: "147 Quốc lộ 1A, Đồng Nai",
    },
    {
        id: "8",
        storeName: "NPP Vạn Lộc",
        type: "NPP",
        area: "Long An",
        phone: "0908901234",
        email: "vanloc.npp@gmail.com",
        address: "258 Hùng Vương, Long An",
    },
];

export const mockProducts: Product[] = [
    {
        id: "1",
        sku: "UHI-001",
        name: "Nước tăng lực UHI Energy 330ml",
        brand: "UHI",
        unit: "Lon",
        wholesalePrice: 8500,
        retailPrice: 10000,
        stock: 500,
    },
    {
        id: "2",
        sku: "BOYO-001",
        name: "Sữa chua uống BOYO Dâu 180ml",
        brand: "BOYO",
        unit: "Chai",
        wholesalePrice: 6000,
        retailPrice: 7500,
        stock: 800,
    },
    {
        id: "3",
        sku: "CVT-001",
        name: "Nước khoáng CVT 500ml",
        brand: "CVT",
        unit: "Chai",
        wholesalePrice: 3000,
        retailPrice: 4000,
        stock: 1200,
    },
    {
        id: "4",
        sku: "LYHU-001",
        name: "Trà xanh LYHU Premium 450ml",
        brand: "LYHU",
        unit: "Chai",
        wholesalePrice: 7000,
        retailPrice: 9000,
        stock: 600,
    },
    {
        id: "5",
        sku: "UHI-002",
        name: "Nước tăng lực UHI Plus 500ml",
        brand: "UHI",
        unit: "Lon",
        wholesalePrice: 12000,
        retailPrice: 15000,
        stock: 300,
    },
    {
        id: "6",
        sku: "BOYO-002",
        name: "Sữa chua uống BOYO Việt Quất 180ml",
        brand: "BOYO",
        unit: "Chai",
        wholesalePrice: 6500,
        retailPrice: 8000,
        stock: 750,
    },
    {
        id: "7",
        sku: "CVT-002",
        name: "Nước khoáng CVT 1.5L",
        brand: "CVT",
        unit: "Chai",
        wholesalePrice: 7500,
        retailPrice: 9000,
        stock: 400,
    },
    {
        id: "8",
        sku: "LYHU-002",
        name: "Trà đào LYHU Deluxe 450ml",
        brand: "LYHU",
        unit: "Chai",
        wholesalePrice: 8000,
        retailPrice: 10000,
        stock: 550,
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
];
