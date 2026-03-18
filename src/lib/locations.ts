import { Region } from "./usersStore";

// === Danh sách 34 Tỉnh/Thành sau sáp nhập 01/07/2025 ===
export const PROVINCES_VN = [
    "Hà Nội",
    "TP.HCM",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "Huế",
    "An Giang",
    "Bắc Ninh",
    "Cà Mau",
    "Cao Bằng",
    "Đắk Lắk",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Tĩnh",
    "Hưng Yên",
    "Khánh Hòa",
    "Lai Châu",
    "Lâm Đồng",
    "Lạng Sơn",
    "Lào Cai",
    "Nghệ An",
    "Ninh Bình",
    "Phú Thọ",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sơn La",
    "Tây Ninh",
    "Thái Nguyên",
    "Thanh Hóa",
    "Tuyên Quang",
    "Vĩnh Long",
    "Unknown",
];

// === Phân vùng sau sáp nhập ===
// Lưu ý: Nhiều tỉnh cũ đã sáp nhập vào tỉnh lớn hơn
// VD: Hà Giang+Bắc Kạn → Cao Bằng, Hà Nam+Nam Định+Thái Bình → Ninh Bình,
// Bình Dương+Bình Phước → Tây Ninh, Bình Định+Phú Yên+Quảng Nam → Quảng Ngãi, etc.
export const REGION_BY_PROVINCE: Record<string, Region> = {
    "Hà Nội": "North",
    "Hải Phòng": "North",
    "Quảng Ninh": "North",
    "Bắc Ninh": "North",
    "Hưng Yên": "North",
    "Ninh Bình": "North",
    "Phú Thọ": "North",
    "Thái Nguyên": "North",
    "Nghệ An": "North",
    "Thanh Hóa": "North",
    "Hà Tĩnh": "North",
    "Cao Bằng": "North",
    "Tuyên Quang": "North",
    "Điện Biên": "North",
    "Lai Châu": "North",
    "Sơn La": "North",
    "Lào Cai": "North",
    "Lạng Sơn": "North",

    "Đà Nẵng": "Central",
    "Huế": "Central",
    "Quảng Trị": "Central",
    "Quảng Ngãi": "Central",
    "Gia Lai": "Central",
    "Đắk Lắk": "Central",
    "Khánh Hòa": "Central",
    "Lâm Đồng": "Central",

    "TP.HCM": "South",
    "Cần Thơ": "South",
    "Đồng Nai": "South",
    "Tây Ninh": "South",
    "An Giang": "South",
    "Vĩnh Long": "South",
    "Đồng Tháp": "South",
    "Cà Mau": "South",

    "Unknown": "Other",
};

export function getRegionFromProvince(province: string): Region {
    return REGION_BY_PROVINCE[province] || "Other";
}

export const REGION_LABELS: Record<Region, string> = {
    North: "Miền Bắc",
    Central: "Miền Trung",
    South: "Miền Nam",
    Other: "Khác",
};
