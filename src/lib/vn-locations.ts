export interface LocationOption {
    value: string; // Tên (Hà Nội) - Lưu trực tiếp tên vào DB
    code: string;  // Mã (01) - Dùng để lookup
    label: string; // Hiển thị (Thành phố Hà Nội)
}

// === Danh sách 34 Tỉnh/Thành sau sáp nhập 2025 (API v2) ===
// 6 thành phố trực thuộc TW + 28 tỉnh
export const PROVINCES: LocationOption[] = [
    { value: "Hà Nội", code: "01", label: "Thành phố Hà Nội" },
    { value: "Hồ Chí Minh", code: "79", label: "Thành phố Hồ Chí Minh" },
    { value: "Đà Nẵng", code: "48", label: "Thành phố Đà Nẵng" },
    { value: "Hải Phòng", code: "31", label: "Thành phố Hải Phòng" },
    { value: "Cần Thơ", code: "92", label: "Thành phố Cần Thơ" },
    { value: "Huế", code: "46", label: "Thành phố Huế" },
    { value: "An Giang", code: "91", label: "Tỉnh An Giang" },
    { value: "Bắc Ninh", code: "24", label: "Tỉnh Bắc Ninh" },
    { value: "Cà Mau", code: "96", label: "Tỉnh Cà Mau" },
    { value: "Cao Bằng", code: "04", label: "Tỉnh Cao Bằng" },
    { value: "Đắk Lắk", code: "66", label: "Tỉnh Đắk Lắk" },
    { value: "Điện Biên", code: "11", label: "Tỉnh Điện Biên" },
    { value: "Đồng Nai", code: "75", label: "Tỉnh Đồng Nai" },
    { value: "Đồng Tháp", code: "82", label: "Tỉnh Đồng Tháp" },
    { value: "Gia Lai", code: "52", label: "Tỉnh Gia Lai" },
    { value: "Hà Tĩnh", code: "42", label: "Tỉnh Hà Tĩnh" },
    { value: "Hưng Yên", code: "33", label: "Tỉnh Hưng Yên" },
    { value: "Khánh Hòa", code: "56", label: "Tỉnh Khánh Hòa" },
    { value: "Lai Châu", code: "12", label: "Tỉnh Lai Châu" },
    { value: "Lâm Đồng", code: "68", label: "Tỉnh Lâm Đồng" },
    { value: "Lạng Sơn", code: "20", label: "Tỉnh Lạng Sơn" },
    { value: "Lào Cai", code: "15", label: "Tỉnh Lào Cai" },
    { value: "Nghệ An", code: "40", label: "Tỉnh Nghệ An" },
    { value: "Ninh Bình", code: "37", label: "Tỉnh Ninh Bình" },
    { value: "Phú Thọ", code: "25", label: "Tỉnh Phú Thọ" },
    { value: "Quảng Ngãi", code: "51", label: "Tỉnh Quảng Ngãi" },
    { value: "Quảng Ninh", code: "22", label: "Tỉnh Quảng Ninh" },
    { value: "Quảng Trị", code: "44", label: "Tỉnh Quảng Trị" },
    { value: "Sơn La", code: "14", label: "Tỉnh Sơn La" },
    { value: "Tây Ninh", code: "80", label: "Tỉnh Tây Ninh" },
    { value: "Thái Nguyên", code: "19", label: "Tỉnh Thái Nguyên" },
    { value: "Thanh Hóa", code: "38", label: "Tỉnh Thanh Hóa" },
    { value: "Tuyên Quang", code: "08", label: "Tỉnh Tuyên Quang" },
    { value: "Vĩnh Long", code: "86", label: "Tỉnh Vĩnh Long" },
].sort((a, b) => a.label.localeCompare(b.label));

// Hàm load Phường/Xã trực tiếp từ Tỉnh/Thành (API v2 - không còn cấp Quận/Huyện)
// Sử dụng API v2: https://provinces.open-api.vn/api/v2/
// Có cơ chế Cache LocalStorage để tăng tốc độ.

const getCache = (key: string) => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(`vn_loc_v2_${key}`);
    if (!cached) return null;
    try {
        const { data, expiry } = JSON.parse(cached);
        if (Date.now() > expiry) {
            localStorage.removeItem(`vn_loc_v2_${key}`);
            return null;
        }
        return data;
    } catch {
        return null;
    }
};

const setCache = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // Cache 24h
    localStorage.setItem(`vn_loc_v2_${key}`, JSON.stringify({ data, expiry }));
};

// Xóa cache v1 cũ khi module được load lần đầu
if (typeof window !== 'undefined') {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vn_loc_') && !key.startsWith('vn_loc_v2_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
        // ignore
    }
}

/**
 * Fetch Phường/Xã trực tiếp từ Tỉnh/Thành (API v2 - 2 cấp, không qua Quận/Huyện)
 */
export const fetchWards = async (provinceCode: string): Promise<LocationOption[]> => {
    const cacheKey = `w_${provinceCode}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
        const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`);
        if (!res.ok) return [];
        const data = await res.json();
        const mapped = (data.wards || []).map((w: any) => ({
            value: w.name,
            code: w.code,
            label: w.name
        }));
        setCache(cacheKey, mapped);
        return mapped;
    } catch {
        return [];
    }
}

// === DEPRECATED: fetchDistricts không còn sử dụng sau sáp nhập 2025 ===
// Giữ lại export rỗng để backward compatible nếu có file nào import
/** @deprecated Không còn cấp Quận/Huyện sau sáp nhập 01/07/2025 */
export const fetchDistricts = async (_provinceCode: string): Promise<LocationOption[]> => {
    console.warn('[vn-locations] fetchDistricts() is deprecated. District tier eliminated after 01/07/2025 merger.');
    return [];
}
