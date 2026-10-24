// Bảng báo giá chính thức Tháng 10.2026 trích xuất từ 2 file:
// 1. "Báo giá NPP tháng 10.2026.xlsx" (Áp dụng cho Nhà Phân Phối / Giá Sỉ)
// 2. "Báo giá siêu thị tháng 10.2026.xlsx" (Áp dụng cho Kênh Siêu Thị / Mini mart)
// Đơn giá được tách thành:
// - Đơn giá chưa thuế (-8% VAT)
// - Đơn giá đã bao gồm 8% VAT

export type PriceBookType = 
    | 'npp' // Giá Sỉ NPP (Chưa VAT - Giảm 8%)
    | 'npp_vat' // Giá Sỉ NPP (Đã gồm 8% VAT)
    | 'supermarket' // Giá Siêu Thị (Chưa VAT - Giảm 8%)
    | 'supermarket_vat' // Giá Siêu Thị (Đã gồm 8% VAT)
    | 'retail'; // Giá Bán Lẻ

export interface PriceBookMeta {
    id: PriceBookType;
    name: string;
    shortName: string;
    description: string;
    badge: string;
    color: string;
    activeBorder: string;
    bgActive: string;
    isVatIncluded: boolean;
    group: 'npp' | 'supermarket' | 'retail';
}

export const PRICE_BOOKS: Record<PriceBookType, PriceBookMeta> = {
    npp: {
        id: 'npp',
        name: 'Bảng Giá Sỉ NPP (Chưa VAT)',
        shortName: 'Sỉ NPP (Chưa VAT)',
        description: 'Báo giá NPP Tháng 10.2026 Chưa thuế (đã giảm 8% VAT)',
        badge: 'Sỉ NPP (Chưa VAT -8%)',
        color: 'text-amber-800 bg-amber-50 border-amber-300',
        activeBorder: 'border-amber-500 ring-2 ring-amber-400/30',
        bgActive: 'bg-amber-500 text-white',
        isVatIncluded: false,
        group: 'npp'
    },
    npp_vat: {
        id: 'npp_vat',
        name: 'Bảng Giá Sỉ NPP (Đã gồm 8% VAT)',
        shortName: 'Sỉ NPP (Có VAT)',
        description: 'Báo giá NPP Tháng 10.2026 Đã bao gồm 8% VAT',
        badge: 'Sỉ NPP (Có VAT +8%)',
        color: 'text-amber-900 bg-amber-100/70 border-amber-400',
        activeBorder: 'border-amber-600 ring-2 ring-amber-500/30',
        bgActive: 'bg-amber-600 text-white',
        isVatIncluded: true,
        group: 'npp'
    },
    supermarket: {
        id: 'supermarket',
        name: 'Bảng Giá Siêu Thị (Chưa VAT)',
        shortName: 'Siêu Thị (Chưa VAT)',
        description: 'Báo giá Siêu Thị Tháng 10.2026 Chưa thuế (đã giảm 8% VAT)',
        badge: 'Siêu Thị (Chưa VAT -8%)',
        color: 'text-blue-800 bg-blue-50 border-blue-300',
        activeBorder: 'border-blue-500 ring-2 ring-blue-400/30',
        bgActive: 'bg-blue-600 text-white',
        isVatIncluded: false,
        group: 'supermarket'
    },
    supermarket_vat: {
        id: 'supermarket_vat',
        name: 'Bảng Giá Siêu Thị (Đã gồm 8% VAT)',
        shortName: 'Siêu Thị (Có VAT)',
        description: 'Báo giá Siêu Thị Tháng 10.2026 Đã bao gồm 8% VAT',
        badge: 'Siêu Thị (Có VAT +8%)',
        color: 'text-blue-900 bg-blue-100/70 border-blue-400',
        activeBorder: 'border-blue-700 ring-2 ring-blue-500/30',
        bgActive: 'bg-blue-700 text-white',
        isVatIncluded: true,
        group: 'supermarket'
    },
    retail: {
        id: 'retail',
        name: 'Bảng Giá Bán Lẻ',
        shortName: 'Giá Bán Lẻ',
        description: 'Giá bán lẻ niêm yết dành cho khách lẻ tiêu dùng',
        badge: 'Giá Bán Lẻ',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        activeBorder: 'border-emerald-500 ring-2 ring-emerald-400/30',
        bgActive: 'bg-emerald-600 text-white',
        isVatIncluded: true,
        group: 'retail'
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
    nppPricePreVat: number; // Đơn giá NPP chưa thuế (-8%)
    boxPrice: number; // Đơn giá theo thùng (+8% VAT)
    boxPricePreVat: number; // Đơn giá theo thùng chưa thuế (-8%)
    supermarketPrice: number; // Đơn giá chào siêu thị (+8% VAT)
    supermarketPricePreVat: number; // Đơn giá siêu thị chưa thuế (-8%)
    origin?: string;
}

export const OCTOBER_2026_MASTER_PRICES: MasterPriceItem[] = [
    {
        "stt": 1,
        "barcode": "6971443681498",
        "name": "Khoai môn sấy tẩm vị gạch cua 35g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "35g",
        "hsd": "12 tháng",
        "packaging": "30 gói/ thùng",
        "nppPrice": 14000,
        "boxPrice": 420000,
        "supermarketPrice": 18000,
        "nppPricePreVat": 12880,
        "boxPricePreVat": 386400,
        "supermarketPricePreVat": 16560
    },
    {
        "stt": 2,
        "barcode": "6971443681160",
        "name": "Khoai môn sấy tẩm vị hành lá 35g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "35g",
        "hsd": "12 tháng",
        "packaging": "30 gói/ thùng",
        "nppPrice": 14000,
        "boxPrice": 420000,
        "supermarketPrice": 18000,
        "nppPricePreVat": 12880,
        "boxPricePreVat": 386400,
        "supermarketPricePreVat": 16560
    },
    {
        "stt": 3,
        "barcode": "6971443681153",
        "name": "Khoai môn sấy tẩm vị trứng muối 35g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "35g",
        "hsd": "12 tháng",
        "packaging": "30 gói/ thùng",
        "nppPrice": 14000,
        "boxPrice": 420000,
        "supermarketPrice": 18000,
        "nppPricePreVat": 12880,
        "boxPricePreVat": 386400,
        "supermarketPricePreVat": 16560
    },
    {
        "stt": 4,
        "barcode": "6971443680569",
        "name": "Khoai môn sấy tẩm vị nấm truffle và thịt nguội 35g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "35g",
        "hsd": "12 tháng",
        "packaging": "30 gói/ thùng",
        "nppPrice": 14000,
        "boxPrice": 420000,
        "supermarketPrice": 18000,
        "nppPricePreVat": 12880,
        "boxPricePreVat": 386400,
        "supermarketPricePreVat": 16560
    },
    {
        "stt": 6,
        "barcode": "6971443680439",
        "name": "Khoai môn sấy tẩm vị gạch cua 75g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "75g",
        "hsd": "12 tháng",
        "packaging": "30 gói/ thùng",
        "nppPrice": 27500,
        "boxPrice": 825000,
        "supermarketPrice": 30000,
        "nppPricePreVat": 25300,
        "boxPricePreVat": 759000,
        "supermarketPricePreVat": 27600
    },
    {
        "stt": 7,
        "barcode": "6971443680729",
        "name": "Khoai môn sấy tẩm vị cay tứ xuyên 75g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "75g",
        "hsd": "12 tháng",
        "packaging": "30 gói/ thùng",
        "nppPrice": 27500,
        "boxPrice": 825000,
        "supermarketPrice": 30000,
        "nppPricePreVat": 25300,
        "boxPricePreVat": 759000,
        "supermarketPricePreVat": 27600
    },
    {
        "stt": 8,
        "barcode": "6971443681146",
        "name": "Khoai môn sấy tẩm vị hành lá 75g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "75g",
        "hsd": "12 tháng",
        "packaging": "30 gói/ thùng",
        "nppPrice": 27500,
        "boxPrice": 825000,
        "supermarketPrice": 30000,
        "nppPricePreVat": 25300,
        "boxPricePreVat": 759000,
        "supermarketPricePreVat": 27600
    },
    {
        "stt": 9,
        "barcode": "6971443681139",
        "name": "Khoai môn sấy tẩm vị trứng muối 75g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "75g",
        "hsd": "12 tháng",
        "packaging": "30 gói/ thùng",
        "nppPrice": 27500,
        "boxPrice": 825000,
        "supermarketPrice": 30000,
        "nppPricePreVat": 25300,
        "boxPricePreVat": 759000,
        "supermarketPricePreVat": 27600
    },
    {
        "stt": 10,
        "barcode": "6971443680521",
        "name": "Khoai môn sấy tẩm vị gạch cua 180g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "180g",
        "hsd": "12 tháng",
        "packaging": "20 gói/ thùng",
        "nppPrice": 50000,
        "boxPrice": 1000000,
        "supermarketPrice": 60000,
        "nppPricePreVat": 46000,
        "boxPricePreVat": 920000,
        "supermarketPricePreVat": 55200
    },
    {
        "stt": 11,
        "barcode": "971443680804",
        "name": "Khoai môn sấy tẩm vị cay tứ xuyên  180g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "180g",
        "hsd": "12 tháng",
        "packaging": "20 gói/ thùng",
        "nppPrice": 50000,
        "boxPrice": 1000000,
        "supermarketPrice": 60000,
        "nppPricePreVat": 46000,
        "boxPricePreVat": 920000,
        "supermarketPricePreVat": 55200
    },
    {
        "stt": 12,
        "barcode": "6971443680798",
        "name": "Khoai môn sấy tẩm vị trứng muối 180g",
        "category": "KHOAI MÔN SẤY TẨM VỊ CVT",
        "unit": "Gói",
        "weight": "180g",
        "hsd": "12 tháng",
        "packaging": "20 gói/ thùng",
        "nppPrice": 50000,
        "boxPrice": 1000000,
        "supermarketPrice": 60000,
        "nppPricePreVat": 46000,
        "boxPricePreVat": 920000,
        "supermarketPricePreVat": 55200
    },
    {
        "stt": 1,
        "barcode": "8809943280225",
        "name": "Kẹo dẻo siêu chua vị Soda",
        "category": "KẸO DẺO SIÊU CHUA UHi",
        "unit": "Gói",
        "weight": "40g",
        "hsd": "18 tháng",
        "packaging": "40g x 24 gói/ hộp.            1 thùng 4 hộp",
        "nppPrice": 12500,
        "boxPrice": 1200000,
        "supermarketPrice": 16200,
        "nppPricePreVat": 11500,
        "boxPricePreVat": 1104000,
        "supermarketPricePreVat": 14904
    },
    {
        "stt": 2,
        "barcode": "8809943280201",
        "name": "Kẹo dẻo siêu chua vị Cola",
        "category": "KẸO DẺO SIÊU CHUA UHi",
        "unit": "Gói",
        "weight": "40g",
        "hsd": "18 tháng",
        "packaging": "40g x 24 gói/ hộp.            1 thùng 4 hộp",
        "nppPrice": 12500,
        "boxPrice": 1200000,
        "supermarketPrice": 16200,
        "nppPricePreVat": 11500,
        "boxPricePreVat": 1104000,
        "supermarketPricePreVat": 14904
    },
    {
        "stt": 3,
        "barcode": "8809004644133",
        "name": "Kẹo dẻo siêu chua vị Đào",
        "category": "KẸO DẺO SIÊU CHUA UHi",
        "unit": "Gói",
        "weight": "40g",
        "hsd": "18 tháng",
        "packaging": "40g x 24 gói/ hộp.            1 thùng 4 hộp",
        "nppPrice": 12500,
        "boxPrice": 1200000,
        "supermarketPrice": 16200,
        "nppPricePreVat": 11500,
        "boxPricePreVat": 1104000,
        "supermarketPricePreVat": 14904
    },
    {
        "stt": 4,
        "barcode": "8809943280904",
        "name": "KẸO SÔ-CÔ-LA VIÊN SỎI",
        "category": "KẸO DẺO SIÊU CHUA UHi",
        "unit": "Gói",
        "weight": "25g",
        "hsd": "24 tháng",
        "packaging": "25g x 20 gói/ hộp     1 thùng 24 hộp",
        "nppPrice": 10000,
        "boxPrice": 4800000,
        "supermarketPrice": 14000,
        "nppPricePreVat": 9200,
        "boxPricePreVat": 4416000,
        "supermarketPricePreVat": 12880
    },
    {
        "stt": 5,
        "barcode": "8809943280591",
        "name": "Kẻo dẻo TWITCHUI  vị chanh",
        "category": "KẸO DẺO SIÊU CHUA UHi",
        "unit": "Gói",
        "weight": "24g",
        "hsd": "18 tháng",
        "packaging": "24g x 30 gói/ hộp.            1 thùng 12 hộp",
        "nppPrice": 9000,
        "boxPrice": 3240000,
        "supermarketPrice": 10800,
        "nppPricePreVat": 8280,
        "boxPricePreVat": 2980800,
        "supermarketPricePreVat": 9936
    },
    {
        "stt": 6,
        "barcode": "8809004645604",
        "name": "KẸO DẺO VỊ CHANH COLA CHEWRAFFI",
        "category": "KẸO DẺO SIÊU CHUA UHi",
        "unit": "Gói",
        "weight": "70g",
        "hsd": "18 tháng",
        "packaging": "70g X 10 gói/ hộp   1 thùng 8 hộp",
        "nppPrice": 20000,
        "boxPrice": 1600000,
        "supermarketPrice": 25000,
        "nppPricePreVat": 18400,
        "boxPricePreVat": 1472000,
        "supermarketPricePreVat": 23000
    },
    {
        "stt": 7,
        "barcode": "8809943280928",
        "name": "KẸO DẺO VỊ KEM SODA CHEWRAFFI",
        "category": "KẸO DẺO SIÊU CHUA UHi",
        "unit": "Gói",
        "weight": "70g",
        "hsd": "18 tháng",
        "packaging": "70g X 10 gói/ hộp   1 thùng 8 hộp",
        "nppPrice": 20000,
        "boxPrice": 1600000,
        "supermarketPrice": 25000,
        "nppPricePreVat": 18400,
        "boxPricePreVat": 1472000,
        "supermarketPricePreVat": 23000
    },
    {
        "stt": 8,
        "barcode": "8809652020396",
        "name": "BÁNH MÌ NƯỚNG GIÒN VỊ BƠ MOMMY’S RUSK",
        "category": "KẸO DẺO SIÊU CHUA UHi",
        "unit": "Gói",
        "weight": "50g",
        "hsd": "10 tháng",
        "packaging": "50g x 16 gói/ thùng",
        "nppPrice": 16000,
        "boxPrice": 256000,
        "supermarketPrice": 20000,
        "nppPricePreVat": 14720,
        "boxPricePreVat": 235520,
        "supermarketPricePreVat": 18400
    },
    {
        "stt": 1,
        "barcode": "8938540202023",
        "name": "Bánh tráng bơ Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "150g",
        "hsd": "1 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 31320,
        "boxPrice": 1566000,
        "supermarketPrice": 34560,
        "nppPricePreVat": 28814,
        "boxPricePreVat": 1440720,
        "supermarketPricePreVat": 31795
    },
    {
        "stt": 2,
        "barcode": "8938540202115",
        "name": "Bánh tráng sốt me Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "100g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 30240,
        "boxPrice": 1512000,
        "supermarketPrice": 34560,
        "nppPricePreVat": 27821,
        "boxPricePreVat": 1391040,
        "supermarketPricePreVat": 31795
    },
    {
        "stt": 3,
        "barcode": "8938540202054",
        "name": "Bánh tráng sa tế cay Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "80g",
        "hsd": "12 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 21600,
        "boxPrice": 1080000,
        "supermarketPrice": 34560,
        "nppPricePreVat": 19872,
        "boxPricePreVat": 993600,
        "supermarketPricePreVat": 31795
    },
    {
        "stt": 4,
        "barcode": "8938540202184",
        "name": "Bánh tráng Tomyum Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "80g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 21600,
        "boxPrice": 1080000,
        "supermarketPrice": 34560,
        "nppPricePreVat": 19872,
        "boxPricePreVat": 993600,
        "supermarketPricePreVat": 31795
    },
    {
        "stt": 5,
        "barcode": "8938540202030",
        "name": "Bánh tráng phô mai Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "80g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 27000,
        "boxPrice": 1350000,
        "supermarketPrice": 32400,
        "nppPricePreVat": 24840,
        "boxPricePreVat": 1242000,
        "supermarketPricePreVat": 29808
    },
    {
        "stt": 6,
        "barcode": "8938540202092",
        "name": "Bánh tráng vị gà quay Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "80g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 24840,
        "boxPrice": 1242000,
        "supermarketPrice": 32400,
        "nppPricePreVat": 22853,
        "boxPricePreVat": 1142640,
        "supermarketPricePreVat": 29808
    },
    {
        "stt": 7,
        "barcode": "8938540202061",
        "name": "Bánh tráng Trứng muối Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "50g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 24840,
        "boxPrice": 1242000,
        "supermarketPrice": 32400,
        "nppPricePreVat": 22853,
        "boxPricePreVat": 1142640,
        "supermarketPricePreVat": 29808
    },
    {
        "stt": 8,
        "barcode": "8938540202047",
        "name": "Bánh tráng trà xanh Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "80g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 24840,
        "boxPrice": 1242000,
        "supermarketPrice": 32400,
        "nppPricePreVat": 22853,
        "boxPricePreVat": 1142640,
        "supermarketPricePreVat": 29808
    },
    {
        "stt": 9,
        "barcode": "8938540202085",
        "name": "Rong biển nướng hải sản Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "50g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 28080,
        "boxPrice": 1404000,
        "supermarketPrice": 32400,
        "nppPricePreVat": 25834,
        "boxPricePreVat": 1291680,
        "supermarketPricePreVat": 29808
    },
    {
        "stt": 10,
        "barcode": "8938540202191",
        "name": "Da cá lắc phô mai Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "70g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 36720,
        "boxPrice": 1836000,
        "supermarketPrice": 38880,
        "nppPricePreVat": 33782,
        "boxPricePreVat": 1689120,
        "supermarketPricePreVat": 35770
    },
    {
        "stt": 11,
        "barcode": "8938540202122",
        "name": "Da cá cà ri cua Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "70g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 36720,
        "boxPrice": 1836000,
        "supermarketPrice": 38880,
        "nppPricePreVat": 33782,
        "boxPricePreVat": 1689120,
        "supermarketPricePreVat": 35770
    },
    {
        "stt": 12,
        "barcode": "8938540202122",
        "name": "Khô gà Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "70g",
        "hsd": "12 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 36720,
        "boxPrice": 1836000,
        "supermarketPrice": 38880,
        "nppPricePreVat": 33782,
        "boxPricePreVat": 1689120,
        "supermarketPricePreVat": 35770
    },
    {
        "stt": 13,
        "barcode": "8938540202153",
        "name": "Mực nướng bơ tỏi Abi",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "70g",
        "hsd": "6 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 43200,
        "boxPrice": 2160000,
        "supermarketPrice": 44280,
        "nppPricePreVat": 39744,
        "boxPricePreVat": 1987200,
        "supermarketPricePreVat": 40738
    },
    {
        "stt": 14,
        "barcode": "8938540202146",
        "name": "Cơm cháy siêu vị ABI",
        "category": "BÁNH TRÁNG ABI SNACK",
        "unit": "Gói",
        "weight": "70g",
        "hsd": "3 tháng",
        "packaging": "50 gói/ thùng",
        "nppPrice": 28080,
        "boxPrice": 1404000,
        "supermarketPrice": 32400,
        "nppPricePreVat": 25834,
        "boxPricePreVat": 1291680,
        "supermarketPricePreVat": 29808
    }
];

/**
 * Chuẩn hóa chuỗi tìm kiếm (loại bỏ dấu và ký tự đặc biệt)
 */
function normalizeText(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

/**
 * Tìm kiếm sản phẩm trong bảng giá mẫu Tháng 10 theo SKU/mã vạch hoặc Tên sản phẩm
 */
export function findMasterPriceItem(sku?: string, name?: string): MasterPriceItem | undefined {
    if (!sku && !name) return undefined;

    if (sku) {
        const cleanSku = sku.trim();
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
    const matched = findMasterPriceItem(product.sku, product.name);

    // 1. NPP Chưa VAT (-8%)
    if (priceBook === 'npp') {
        if (matched) return matched.nppPricePreVat;
        const base = product.wholesalePrice || product.price || 0;
        return Math.round(base * 0.92);
    }

    // 2. NPP Đã có 8% VAT
    if (priceBook === 'npp_vat') {
        if (matched) return matched.nppPrice;
        return product.wholesalePrice || product.price || 0;
    }

    // 3. Siêu thị Chưa VAT (-8%)
    if (priceBook === 'supermarket') {
        if (matched) return matched.supermarketPricePreVat;
        const base = product.supermarketPrice || product.wholesalePrice || product.price || 0;
        return Math.round(base * 0.92);
    }

    // 4. Siêu thị Đã có 8% VAT
    if (priceBook === 'supermarket_vat') {
        if (matched) return matched.supermarketPrice;
        return product.supermarketPrice || product.wholesalePrice || product.price || 0;
    }

    // 5. Bán lẻ
    if (product.retailPrice && product.retailPrice > 0) return product.retailPrice;
    if (product.price && product.price > 0) return product.price;
    if (matched) return matched.supermarketPrice;
    return product.wholesalePrice || 0;
}
