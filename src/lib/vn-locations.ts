export interface LocationOption {
    value: string; // Tên (Hà Nội) - Lưu trực tiếp tên vào DB
    code: string;  // Mã (01) - Dùng để lookup
    label: string; // Hiển thị (Thành phố Hà Nội)
}

// Dữ liệu mẫu rút gọn (Thực tế sẽ cần import file JSON lớn hơn hoặc gọi API)
// Ở đây em demo cấu trúc. Nếu anh cần full 63 tỉnh thành, em sẽ dùng cách load dynamic.
export const PROVINCES: LocationOption[] = [
    { value: "Hà Nội", code: "01", label: "Thành phố Hà Nội" },
    { value: "Hồ Chí Minh", code: "79", label: "Thành phố Hồ Chí Minh" },
    { value: "Đà Nẵng", code: "48", label: "Thành phố Đà Nẵng" },
    { value: "Hải Phòng", code: "31", label: "Thành phố Hải Phòng" },
    { value: "Cần Thơ", code: "92", label: "Thành phố Cần Thơ" },
    { value: "An Giang", code: "89", label: "Tỉnh An Giang" },
    { value: "Bà Rịa - Vũng Tàu", code: "77", label: "Tỉnh Bà Rịa - Vũng Tàu" },
    { value: "Bắc Giang", code: "24", label: "Tỉnh Bắc Giang" },
    { value: "Bắc Kạn", code: "06", label: "Tỉnh Bắc Kạn" },
    { value: "Bạc Liêu", code: "95", label: "Tỉnh Bạc Liêu" },
    { value: "Bắc Ninh", code: "27", label: "Tỉnh Bắc Ninh" },
    { value: "Bến Tre", code: "83", label: "Tỉnh Bến Tre" },
    { value: "Bình Định", code: "52", label: "Tỉnh Bình Định" },
    { value: "Bình Dương", code: "74", label: "Tỉnh Bình Dương" },
    { value: "Bình Phước", code: "70", label: "Tỉnh Bình Phước" },
    { value: "Bình Thuận", code: "60", label: "Tỉnh Bình Thuận" },
    { value: "Cà Mau", code: "96", label: "Tỉnh Cà Mau" },
    { value: "Cao Bằng", code: "04", label: "Tỉnh Cao Bằng" },
    { value: "Đắk Lắk", code: "66", label: "Tỉnh Đắk Lắk" },
    { value: "Đắk Nông", code: "67", label: "Tỉnh Đắk Nông" },
    { value: "Điện Biên", code: "11", label: "Tỉnh Điện Biên" },
    { value: "Đồng Nai", code: "75", label: "Tỉnh Đồng Nai" },
    { value: "Đồng Tháp", code: "87", label: "Tỉnh Đồng Tháp" },
    { value: "Gia Lai", code: "64", label: "Tỉnh Gia Lai" },
    { value: "Hà Giang", code: "02", label: "Tỉnh Hà Giang" },
    { value: "Hà Nam", code: "35", label: "Tỉnh Hà Nam" },
    { value: "Hà Tĩnh", code: "42", label: "Tỉnh Hà Tĩnh" },
    { value: "Hải Dương", code: "30", label: "Tỉnh Hải Dương" },
    { value: "Hậu Giang", code: "93", label: "Tỉnh Hậu Giang" },
    { value: "Hòa Bình", code: "17", label: "Tỉnh Hòa Bình" },
    { value: "Hưng Yên", code: "33", label: "Tỉnh Hưng Yên" },
    { value: "Khánh Hòa", code: "56", label: "Tỉnh Khánh Hòa" },
    { value: "Kiên Giang", code: "91", label: "Tỉnh Kiên Giang" },
    { value: "Kon Tum", code: "62", label: "Tỉnh Kon Tum" },
    { value: "Lai Châu", code: "12", label: "Tỉnh Lai Châu" },
    { value: "Lâm Đồng", code: "68", label: "Tỉnh Lâm Đồng" },
    { value: "Lạng Sơn", code: "20", label: "Tỉnh Lạng Sơn" },
    { value: "Lào Cai", code: "10", label: "Tỉnh Lào Cai" },
    { value: "Long An", code: "80", label: "Tỉnh Long An" },
    { value: "Nam Định", code: "36", label: "Tỉnh Nam Định" },
    { value: "Nghệ An", code: "40", label: "Tỉnh Nghệ An" },
    { value: "Ninh Bình", code: "37", label: "Tỉnh Ninh Bình" },
    { value: "Ninh Thuận", code: "58", label: "Tỉnh Ninh Thuận" },
    { value: "Phú Thọ", code: "25", label: "Tỉnh Phú Thọ" },
    { value: "Phú Yên", code: "54", label: "Tỉnh Phú Yên" },
    { value: "Quảng Bình", code: "44", label: "Tỉnh Quảng Bình" },
    { value: "Quảng Nam", code: "49", label: "Tỉnh Quảng Nam" },
    { value: "Quảng Ngãi", code: "51", label: "Tỉnh Quảng Ngãi" },
    { value: "Quảng Ninh", code: "22", label: "Tỉnh Quảng Ninh" },
    { value: "Quảng Trị", code: "45", label: "Tỉnh Quảng Trị" },
    { value: "Sóc Trăng", code: "94", label: "Tỉnh Sóc Trăng" },
    { value: "Sơn La", code: "14", label: "Tỉnh Sơn La" },
    { value: "Tây Ninh", code: "72", label: "Tỉnh Tây Ninh" },
    { value: "Thái Bình", code: "34", label: "Tỉnh Thái Bình" },
    { value: "Thái Nguyên", code: "19", label: "Tỉnh Thái Nguyên" },
    { value: "Thanh Hóa", code: "38", label: "Tỉnh Thanh Hóa" },
    { value: "Thừa Thiên Huế", code: "46", label: "Tỉnh Thừa Thiên Huế" },
    { value: "Tiền Giang", code: "82", label: "Tỉnh Tiền Giang" },
    { value: "Trà Vinh", code: "84", label: "Tỉnh Trà Vinh" },
    { value: "Tuyên Quang", code: "08", label: "Tỉnh Tuyên Quang" },
    { value: "Vĩnh Long", code: "86", label: "Tỉnh Vĩnh Long" },
    { value: "Vĩnh Phúc", code: "26", label: "Tỉnh Vĩnh Phúc" },
    { value: "Yên Bái", code: "15", label: "Tỉnh Yên Bái" }
].sort((a, b) => a.label.localeCompare(b.label));

// Hàm load data từ API công khai (để lấy Huyện/Xã động)
// Sử dụng API: https://provinces.open-api.vn/
// Có cơ chế Cache LocalStorage để tăng tốc độ.

const getCache = (key: string) => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(`vn_loc_${key}`);
    if (!cached) return null;
    try {
        const { data, expiry } = JSON.parse(cached);
        if (Date.now() > expiry) {
            localStorage.removeItem(`vn_loc_${key}`);
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
    localStorage.setItem(`vn_loc_${key}`, JSON.stringify({ data, expiry }));
};

export const fetchDistricts = async (provinceCode: string): Promise<LocationOption[]> => {
    const cacheKey = `d_${provinceCode}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        if (!res.ok) return [];
        const data = await res.json();
        const mapped = data.districts.map((d: any) => ({
            value: d.name,
            code: d.code,
            label: d.name
        }));
        setCache(cacheKey, mapped);
        return mapped;
    } catch {
        return [];
    }
}

export const fetchWards = async (districtCode: string): Promise<LocationOption[]> => {
    const cacheKey = `w_${districtCode}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        if (!res.ok) return [];
        const data = await res.json();
        const mapped = data.wards.map((w: any) => ({
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
