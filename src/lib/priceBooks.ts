// Bảng báo giá chính thức Tháng 10.2026 trích xuất từ 2 file:
// 1. "Báo giá NPP tháng 10.2026.xlsx" (Áp dụng cho Nhà Phân Phối / Giá Sỉ)
// 2. "Báo giá siêu thị tháng 10.2026.xlsx" (Áp dụng cho Kênh Siêu Thị / Mini mart)

export type PriceBookType = 'npp' | 'supermarket' | 'retail';

export interface PriceBookMeta {
    id: PriceBookType;
    name: string;
    shortName: string;
    description: string;
    badge: string;
    color: string;
    activeBorder: string;
    bgActive: string;
}

export const PRICE_BOOKS: Record<PriceBookType, PriceBookMeta> = {
    npp: {
        id: 'npp',
        name: 'Bảng Giá Sỉ (NPP)',
        shortName: 'Giá Sỉ (NPP)',
        description: 'Báo giá NPP Tháng 10.2026 (+8% VAT) dành cho Nhà phân phối & Đại lý cấp 1',
        badge: 'Giá Sỉ / NPP',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        activeBorder: 'border-amber-500 ring-2 ring-amber-400/30',
        bgActive: 'bg-amber-500 text-white'
    },
    supermarket: {
        id: 'supermarket',
        name: 'Bảng Giá Siêu Thị',
        shortName: 'Giá Siêu Thị',
        description: 'Báo giá Siêu Thị Tháng 10.2026 (+8% VAT) dành cho hệ thống Siêu thị & Chuỗi Mini Mart',
        badge: 'Giá Siêu Thị',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        activeBorder: 'border-blue-500 ring-2 ring-blue-400/30',
        bgActive: 'bg-blue-600 text-white'
    },
    retail: {
        id: 'retail',
        name: 'Bảng Giá Bán Lẻ',
        shortName: 'Giá Bán Lẻ',
        description: 'Giá bán lẻ niêm yết dành cho khách lẻ tiêu dùng',
        badge: 'Giá Bán Lẻ',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        activeBorder: 'border-emerald-500 ring-2 ring-emerald-400/30',
        bgActive: 'bg-emerald-600 text-white'
    }
};

export interface MasterPriceItem {
    stt: number;
    barcode: string;
    name: string;
    category: string;
    unit: string;
    weight: string;
    hsd: string;
    packaging: string;
    nppPrice: number; // Đơn giá chào NPP (+8% VAT)
    boxPrice: number; // Đơn giá theo thùng (+8% VAT)
    supermarketPrice: number; // Đơn giá chào siêu thị (+8% VAT)
    origin: string;
}

export const OCTOBER_2026_MASTER_PRICES: MasterPriceItem[] = [
    // 1. KHOAI MÔN SẤY TẨM VỊ CVT
    {
        stt: 1,
        barcode: "6971443681498",
        name: "Khoai môn sấy tẩm vị gạch cua 35g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "35g",
        hsd: "12 tháng",
        packaging: "30 gói/ thùng",
        nppPrice: 14000,
        boxPrice: 420000,
        supermarketPrice: 18000,
        origin: "Trung Quốc"
    },
    {
        stt: 2,
        barcode: "6971443681160",
        name: "Khoai môn sấy tẩm vị hành lá 35g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "35g",
        hsd: "12 tháng",
        packaging: "30 gói/ thùng",
        nppPrice: 14000,
        boxPrice: 420000,
        supermarketPrice: 18000,
        origin: "Trung Quốc"
    },
    {
        stt: 3,
        barcode: "6971443681153",
        name: "Khoai môn sấy tẩm vị trứng muối 35g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "35g",
        hsd: "12 tháng",
        packaging: "30 gói/ thùng",
        nppPrice: 14000,
        boxPrice: 420000,
        supermarketPrice: 18000,
        origin: "Trung Quốc"
    },
    {
        stt: 4,
        barcode: "6971443680569",
        name: "Khoai môn sấy tẩm vị nấm truffle và thịt nguội 35g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "35g",
        hsd: "12 tháng",
        packaging: "30 gói/ thùng",
        nppPrice: 14000,
        boxPrice: 420000,
        supermarketPrice: 18000,
        origin: "Trung Quốc"
    },
    {
        stt: 6,
        barcode: "6971443680439",
        name: "Khoai môn sấy tẩm vị gạch cua 75g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "75g",
        hsd: "12 tháng",
        packaging: "30 gói/ thùng",
        nppPrice: 27500,
        boxPrice: 825000,
        supermarketPrice: 30000,
        origin: "Trung Quốc"
    },
    {
        stt: 7,
        barcode: "6971443680729",
        name: "Khoai môn sấy tẩm vị cay tứ xuyên 75g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "75g",
        hsd: "12 tháng",
        packaging: "30 gói/ thùng",
        nppPrice: 27500,
        boxPrice: 825000,
        supermarketPrice: 30000,
        origin: "Trung Quốc"
    },
    {
        stt: 8,
        barcode: "6971443681146",
        name: "Khoai môn sấy tẩm vị hành lá 75g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "75g",
        hsd: "12 tháng",
        packaging: "30 gói/ thùng",
        nppPrice: 27500,
        boxPrice: 825000,
        supermarketPrice: 30000,
        origin: "Trung Quốc"
    },
    {
        stt: 9,
        barcode: "6971443681139",
        name: "Khoai môn sấy tẩm vị trứng muối 75g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "75g",
        hsd: "12 tháng",
        packaging: "30 gói/ thùng",
        nppPrice: 27500,
        boxPrice: 825000,
        supermarketPrice: 30000,
        origin: "Trung Quốc"
    },
    {
        stt: 10,
        barcode: "6971443680521",
        name: "Khoai môn sấy tẩm vị gạch cua 180g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "180g",
        hsd: "12 tháng",
        packaging: "20 gói/ thùng",
        nppPrice: 50000,
        boxPrice: 1000000,
        supermarketPrice: 60000,
        origin: "Trung Quốc"
    },
    {
        stt: 11,
        barcode: "971443680804",
        name: "Khoai môn sấy tẩm vị cay tứ xuyên  180g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "180g",
        hsd: "12 tháng",
        packaging: "20 gói/ thùng",
        nppPrice: 50000,
        boxPrice: 1000000,
        supermarketPrice: 60000,
        origin: "Trung Quốc"
    },
    {
        stt: 12,
        barcode: "6971443680798",
        name: "Khoai môn sấy tẩm vị trứng muối 180g",
        category: "KHOAI MÔN SẤY TẨM VỊ CVT",
        unit: "Gói",
        weight: "180g",
        hsd: "12 tháng",
        packaging: "20 gói/ thùng",
        nppPrice: 50000,
        boxPrice: 1000000,
        supermarketPrice: 60000,
        origin: "Trung Quốc"
    },

    // 2. KẸO DẺO SIÊU CHUA UHi
    {
        stt: 1,
        barcode: "8809943280225",
        name: "Kẹo dẻo siêu chua vị Soda 40g",
        category: "KẸO DẺO SIÊU CHUA UHi",
        unit: "Gói",
        weight: "40g",
        hsd: "18 tháng",
        packaging: "40g x 24 gói/ hộp (1 thùng 4 hộp)",
        nppPrice: 12500,
        boxPrice: 1200000,
        supermarketPrice: 16200,
        origin: "Hàn Quốc"
    },
    {
        stt: 2,
        barcode: "8809943280201",
        name: "Kẹo dẻo siêu chua vị Cola 40g",
        category: "KẸO DẺO SIÊU CHUA UHi",
        unit: "Gói",
        weight: "40g",
        hsd: "18 tháng",
        packaging: "40g x 24 gói/ hộp (1 thùng 4 hộp)",
        nppPrice: 12500,
        boxPrice: 1200000,
        supermarketPrice: 16200,
        origin: "Hàn Quốc"
    },
    {
        stt: 3,
        barcode: "8809004644133",
        name: "Kẹo dẻo siêu chua vị Đào 40g",
        category: "KẸO DẺO SIÊU CHUA UHi",
        unit: "Gói",
        weight: "40g",
        hsd: "18 tháng",
        packaging: "40g x 24 gói/ hộp (1 thùng 4 hộp)",
        nppPrice: 12500,
        boxPrice: 1200000,
        supermarketPrice: 16200,
        origin: "Hàn Quốc"
    },
    {
        stt: 4,
        barcode: "8809943280904",
        name: "KẸO SÔ-CÔ-LA VIÊN SỎI",
        category: "KẸO DẺO SIÊU CHUA UHi",
        unit: "Gói",
        weight: "25g",
        hsd: "24 tháng",
        packaging: "25g x 20 gói/ hộp (1 thùng 24 hộp)",
        nppPrice: 10000,
        boxPrice: 4800000,
        supermarketPrice: 14000,
        origin: "Hàn Quốc"
    },
    {
        stt: 5,
        barcode: "8809943280591",
        name: "Kẹo dẻo TWITCHUI vị chanh 24g",
        category: "KẸO DẺO SIÊU CHUA UHi",
        unit: "Gói",
        weight: "24g",
        hsd: "18 tháng",
        packaging: "24g x 30 gói/ hộp (1 thùng 12 hộp)",
        nppPrice: 9000,
        boxPrice: 3240000,
        supermarketPrice: 10800,
        origin: "Hàn Quốc"
    },
    {
        stt: 6,
        barcode: "8809004645604",
        name: "KẸO DẺO VỊ CHANH COLA CHEWRAFFI",
        category: "KẸO DẺO SIÊU CHUA UHi",
        unit: "Gói",
        weight: "70g",
        hsd: "18 tháng",
        packaging: "70g X 10 gói/ hộp (1 thùng 8 hộp)",
        nppPrice: 20000,
        boxPrice: 1600000,
        supermarketPrice: 25000,
        origin: "Hàn Quốc"
    },
    {
        stt: 7,
        barcode: "8809943280928",
        name: "KẸO DẺO VỊ KEM SODA CHEWRAFFI",
        category: "KẸO DẺO SIÊU CHUA UHi",
        unit: "Gói",
        weight: "70g",
        hsd: "18 tháng",
        packaging: "70g X 10 gói/ hộp (1 thùng 8 hộp)",
        nppPrice: 20000,
        boxPrice: 1600000,
        supermarketPrice: 25000,
        origin: "Hàn Quốc"
    },
    {
        stt: 8,
        barcode: "8809652020396",
        name: "BÁNH MÌ NƯỚNG GIÒN VỊ BƠ MOMMY’S RUSK",
        category: "KẸO DẺO SIÊU CHUA UHi",
        unit: "Gói",
        weight: "50g",
        hsd: "10 tháng",
        packaging: "50g x 16 gói/ thùng",
        nppPrice: 16000,
        boxPrice: 256000,
        supermarketPrice: 20000,
        origin: "Hàn Quốc"
    },

    // 3. BÁNH TRÁNG ABI SNACK
    {
        stt: 1,
        barcode: "8938540202023",
        name: "Bánh tráng bơ Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "150g",
        hsd: "1 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 31320,
        boxPrice: 1566000,
        supermarketPrice: 34560,
        origin: "Việt Nam"
    },
    {
        stt: 2,
        barcode: "8938540202115",
        name: "Bánh tráng sốt me Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "100g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 30240,
        boxPrice: 1512000,
        supermarketPrice: 34560,
        origin: "Việt Nam"
    },
    {
        stt: 3,
        barcode: "8938540202054",
        name: "Bánh tráng sa tế cay Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "80g",
        hsd: "12 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 21600,
        boxPrice: 1080000,
        supermarketPrice: 34560,
        origin: "Việt Nam"
    },
    {
        stt: 4,
        barcode: "8938540202184",
        name: "Bánh tráng Tomyum Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "80g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 21600,
        boxPrice: 1080000,
        supermarketPrice: 34560,
        origin: "Việt Nam"
    },
    {
        stt: 5,
        barcode: "8938540202030",
        name: "Bánh tráng phô mai Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "80g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 27000,
        boxPrice: 1350000,
        supermarketPrice: 32400,
        origin: "Việt Nam"
    },
    {
        stt: 6,
        barcode: "8938540202092",
        name: "Bánh tráng vị gà quay Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "80g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 24840,
        boxPrice: 1242000,
        supermarketPrice: 32400,
        origin: "Việt Nam"
    },
    {
        stt: 7,
        barcode: "8938540202061",
        name: "Bánh tráng Trứng muối Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "80g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 24840,
        boxPrice: 1242000,
        supermarketPrice: 32400,
        origin: "Việt Nam"
    },
    {
        stt: 8,
        barcode: "8938540202047",
        name: "Bánh tráng trà xanh Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "80g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 24840,
        boxPrice: 1242000,
        supermarketPrice: 32400,
        origin: "Việt Nam"
    },
    {
        stt: 9,
        barcode: "8938540202085",
        name: "Rong biển nướng hải sản Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "80g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 28080,
        boxPrice: 1404000,
        supermarketPrice: 32400,
        origin: "Việt Nam"
    },
    {
        stt: 10,
        barcode: "8938540202191",
        name: "Da cá lắc phô mai Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "100g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 36720,
        boxPrice: 1836000,
        supermarketPrice: 38880,
        origin: "Việt Nam"
    },
    {
        stt: 11,
        barcode: "8938540202269",
        name: "Da cá vị cà ri cua Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "100g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 36720,
        boxPrice: 1836000,
        supermarketPrice: 38880,
        origin: "Việt Nam"
    },
    {
        stt: 12,
        barcode: "8938540202122",
        name: "Khô gà Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "100g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 36720,
        boxPrice: 1836000,
        supermarketPrice: 38880,
        origin: "Việt Nam"
    },
    {
        stt: 13,
        barcode: "8938540202153",
        name: "Mực nướng bơ tỏi Abi",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "100g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 43200,
        boxPrice: 2160000,
        supermarketPrice: 44280,
        origin: "Việt Nam"
    },
    {
        stt: 14,
        barcode: "8938540202146",
        name: "Cơm cháy siêu vị ABI",
        category: "BÁNH TRÁNG ABI SNACK",
        unit: "Gói",
        weight: "100g",
        hsd: "6 tháng",
        packaging: "50 gói/ thùng",
        nppPrice: 28080,
        boxPrice: 1404000,
        supermarketPrice: 32400,
        origin: "Việt Nam"
    }
];

function normalizeText(s: string): string {
    return (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Tìm kiếm mục giá trong bảng giá tháng 10 theo SKU/mã vạch hoặc tên
 */
export function findMasterPriceItem(sku?: string, name?: string): MasterPriceItem | undefined {
    const cleanSku = (sku || '').trim();
    if (cleanSku) {
        // Direct match
        const direct = OCTOBER_2026_MASTER_PRICES.find(p => p.barcode === cleanSku);
        if (direct) return direct;

        // Partial match
        const partial = OCTOBER_2026_MASTER_PRICES.find(p =>
            p.barcode.endsWith(cleanSku) || cleanSku.endsWith(p.barcode)
        );
        if (partial) return partial;
    }

    if (name) {
        const normTarget = normalizeText(name);
        if (normTarget.length > 5) {
            const found = OCTOBER_2026_MASTER_PRICES.find(p => {
                const normItem = normalizeText(p.name);
                return normTarget.includes(normItem) || normItem.includes(normTarget);
            });
            if (found) return found;
        }
    }

    return undefined;
}

/**
 * Lấy đơn giá tương ứng theo Bảng Giá được chọn
 */
export function getPriceByPriceBook(
    product: {
        sku?: string;
        name?: string;
        wholesalePrice?: number;
        supermarketPrice?: number;
        retailPrice?: number;
        price?: number;
    },
    priceBook: PriceBookType
): number {
    // 1. Kiểm tra bảng giá mẫu chuẩn tháng 10
    const matched = findMasterPriceItem(product.sku, product.name);

    if (priceBook === 'npp') {
        if (matched) return matched.nppPrice;
        if (product.wholesalePrice && product.wholesalePrice > 0) return product.wholesalePrice;
        return product.price || 0;
    }

    if (priceBook === 'supermarket') {
        if (matched) return matched.supermarketPrice;
        if (product.supermarketPrice && product.supermarketPrice > 0) return product.supermarketPrice;
        if (product.wholesalePrice && product.wholesalePrice > 0) return product.wholesalePrice;
        return product.price || 0;
    }

    // retail
    if (product.retailPrice && product.retailPrice > 0) return product.retailPrice;
    if (product.price && product.price > 0) return product.price;
    if (matched) return matched.supermarketPrice;
    return product.wholesalePrice || 0;
}
