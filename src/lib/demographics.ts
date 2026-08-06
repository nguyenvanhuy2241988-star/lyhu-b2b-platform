export interface ProvinceDemographics {
    area: number; // km2
    population: number; // người
    districts: number; // Số quận/huyện/thị xã/thành phố trực thuộc
    gdp: number; // Tỷ đồng (Tổng GRDP của tỉnh)
    perCapitaIncome: number; // Triệu đồng/người/năm (THU NHẬP BÌNH QUÂN THỰC TẾ, không phải GRDP/người)
}

// Cập nhật số liệu chuẩn năm 2023
export const provinceDemographics: Record<string, ProvinceDemographics> = {
    // Vùng Đồng bằng sông Hồng
    "Hà Nội": { area: 3359, population: 8587100, districts: 30, gdp: 1300000, perCapitaIncome: 77.8 },
    "Vĩnh Phúc": { area: 1235, population: 1210000, districts: 9, gdp: 158000, perCapitaIncome: 75.0 },
    "Bắc Ninh": { area: 822, population: 1515000, districts: 8, gdp: 232000, perCapitaIncome: 85.0 },
    "Quảng Ninh": { area: 6178, population: 1378000, districts: 13, gdp: 315800, perCapitaIncome: 73.3 },
    "Hải Dương": { area: 1668, population: 1950000, districts: 12, gdp: 185000, perCapitaIncome: 72.0 },
    "Hải Phòng": { area: 1522, population: 2100000, districts: 15, gdp: 380000, perCapitaIncome: 76.7 },
    "Hưng Yên": { area: 930, population: 1300000, districts: 10, gdp: 136000, perCapitaIncome: 70.0 },
    "Thái Bình": { area: 1586, population: 1885000, districts: 8, gdp: 131000, perCapitaIncome: 65.0 },
    "Hà Nam": { area: 861, population: 880000, districts: 6, gdp: 51000, perCapitaIncome: 62.0 },
    "Nam Định": { area: 1668, population: 1860000, districts: 10, gdp: 100000, perCapitaIncome: 68.0 },
    "Ninh Bình": { area: 1386, population: 1010000, districts: 8, gdp: 86000, perCapitaIncome: 66.0 },

    // Vùng Trung du và miền núi phía Bắc
    "Hà Giang": { area: 7929, population: 910000, districts: 11, gdp: 31000, perCapitaIncome: 35.0 },
    "Cao Bằng": { area: 6700, population: 545000, districts: 10, gdp: 24000, perCapitaIncome: 38.0 },
    "Bắc Kạn": { area: 4860, population: 325000, districts: 8, gdp: 17000, perCapitaIncome: 37.0 },
    "Tuyên Quang": { area: 5867, population: 810000, districts: 7, gdp: 42000, perCapitaIncome: 45.0 },
    "Lào Cai": { area: 6364, population: 770000, districts: 9, gdp: 72000, perCapitaIncome: 48.0 },
    "Yên Bái": { area: 6887, population: 855000, districts: 9, gdp: 41000, perCapitaIncome: 42.0 },
    "Thái Nguyên": { area: 3526, population: 1340000, districts: 9, gdp: 150000, perCapitaIncome: 65.0 },
    "Lạng Sơn": { area: 8310, population: 805000, districts: 11, gdp: 45000, perCapitaIncome: 46.0 },
    "Bắc Giang": { area: 3895, population: 1910000, districts: 10, gdp: 180000, perCapitaIncome: 62.0 },
    "Phú Thọ": { area: 3534, population: 1515000, districts: 13, gdp: 95000, perCapitaIncome: 55.0 },
    "Điện Biên": { area: 9539, population: 640000, districts: 10, gdp: 26000, perCapitaIncome: 35.0 },
    "Lai Châu": { area: 9068, population: 490000, districts: 8, gdp: 15000, perCapitaIncome: 35.0 },
    "Sơn La": { area: 14123, population: 1320000, districts: 12, gdp: 48000, perCapitaIncome: 38.0 },
    "Hòa Bình": { area: 4590, population: 885000, districts: 10, gdp: 60000, perCapitaIncome: 52.0 },

    // Vùng Bắc Trung Bộ và Duyên hải miền Trung
    "Thanh Hóa": { area: 11120, population: 3750000, districts: 27, gdp: 255000, perCapitaIncome: 58.0 },
    "Nghệ An": { area: 16493, population: 3450000, districts: 21, gdp: 195000, perCapitaIncome: 55.0 },
    "Hà Tĩnh": { area: 5990, population: 1325000, districts: 13, gdp: 102000, perCapitaIncome: 60.0 },
    "Quảng Bình": { area: 8065, population: 920000, districts: 8, gdp: 53000, perCapitaIncome: 52.0 },
    "Quảng Trị": { area: 4739, population: 650000, districts: 10, gdp: 42000, perCapitaIncome: 55.0 },
    "Thừa Thiên–Huế": { area: 5048, population: 1170000, districts: 9, gdp: 72000, perCapitaIncome: 62.0 },
    "Đà Nẵng": { area: 1285, population: 1220000, districts: 8, gdp: 135000, perCapitaIncome: 75.0 },
    "Quảng Nam": { area: 10574, population: 1530000, districts: 18, gdp: 115000, perCapitaIncome: 60.0 },
    "Quảng Ngãi": { area: 5155, population: 1255000, districts: 13, gdp: 125000, perCapitaIncome: 65.0 },
    "Bình Định": { area: 6066, population: 1515000, districts: 11, gdp: 115000, perCapitaIncome: 65.0 },
    "Phú Yên": { area: 5023, population: 885000, districts: 9, gdp: 55000, perCapitaIncome: 58.0 },
    "Khánh Hòa": { area: 5197, population: 1270000, districts: 9, gdp: 125000, perCapitaIncome: 68.0 },
    "Ninh Thuận": { area: 3355, population: 615000, districts: 7, gdp: 45000, perCapitaIncome: 58.0 },
    "Bình Thuận": { area: 7943, population: 1260000, districts: 10, gdp: 105000, perCapitaIncome: 62.0 },

    // Vùng Tây Nguyên
    "Kon Tum": { area: 9674, population: 590000, districts: 10, gdp: 32000, perCapitaIncome: 45.0 },
    "Gia Lai": { area: 15510, population: 1610000, districts: 17, gdp: 105000, perCapitaIncome: 52.0 },
    "Đắk Lắk": { area: 13030, population: 1940000, districts: 15, gdp: 115000, perCapitaIncome: 55.0 },
    "Đắk Nông": { area: 6516, population: 660000, districts: 8, gdp: 40000, perCapitaIncome: 55.0 },
    "Lâm Đồng": { area: 9783, population: 1350000, districts: 12, gdp: 105000, perCapitaIncome: 65.0 },

    // Vùng Đông Nam Bộ
    "Bình Phước": { area: 6873, population: 1050000, districts: 11, gdp: 95000, perCapitaIncome: 65.0 },
    "Tây Ninh": { area: 4041, population: 1210000, districts: 9, gdp: 115000, perCapitaIncome: 72.0 },
    "Bình Dương": { area: 2694, population: 2750000, districts: 9, gdp: 460000, perCapitaIncome: 96.8 }, // Thu nhập BQ cao nhất nước
    "Đồng Nai": { area: 5863, population: 3300000, districts: 11, gdp: 435000, perCapitaIncome: 78.0 },
    "Bà Rịa–Vũng Tàu": { area: 1980, population: 1180000, districts: 8, gdp: 385000, perCapitaIncome: 85.0 },
    "Hồ Chí Minh": { area: 2061, population: 9400000, districts: 22, gdp: 1620000, perCapitaIncome: 78.5 },

    // Vùng Đồng bằng sông Cửu Long
    "Long An": { area: 4494, population: 1750000, districts: 15, gdp: 165000, perCapitaIncome: 75.0 },
    "Tiền Giang": { area: 2510, population: 1800000, districts: 11, gdp: 125000, perCapitaIncome: 65.0 },
    "Bến Tre": { area: 2394, population: 1310000, districts: 9, gdp: 65000, perCapitaIncome: 62.0 },
    "Trà Vinh": { area: 2358, population: 1020000, districts: 9, gdp: 75000, perCapitaIncome: 60.0 },
    "Vĩnh Long": { area: 1525, population: 1040000, districts: 8, gdp: 45000, perCapitaIncome: 62.0 },
    "Đồng Tháp": { area: 3383, population: 1620000, districts: 12, gdp: 105000, perCapitaIncome: 65.0 },
    "An Giang": { area: 3536, population: 1930000, districts: 11, gdp: 115000, perCapitaIncome: 65.0 },
    "Kiên Giang": { area: 6348, population: 1750000, districts: 15, gdp: 135000, perCapitaIncome: 68.0 },
    "Cần Thơ": { area: 1439, population: 1250000, districts: 9, gdp: 135000, perCapitaIncome: 75.0 },
    "Hậu Giang": { area: 1621, population: 740000, districts: 8, gdp: 55000, perCapitaIncome: 65.0 },
    "Sóc Trăng": { area: 3311, population: 1220000, districts: 11, gdp: 72000, perCapitaIncome: 55.0 },
    "Bạc Liêu": { area: 2669, population: 920000, districts: 7, gdp: 65000, perCapitaIncome: 60.0 },
    "Cà Mau": { area: 5221, population: 1220000, districts: 9, gdp: 75000, perCapitaIncome: 55.0 }
};
