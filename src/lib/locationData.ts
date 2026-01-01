export const PROVINCES = [
    { code: '01', name: 'Hà Nội' },
    { code: '79', name: 'Hồ Chí Minh' },
    { code: '48', name: 'Đà Nẵng' },
    { code: '31', name: 'Hải Phòng' },
    { code: '92', name: 'Cần Thơ' },
    { code: '27', name: 'Bắc Ninh' },
    { code: '26', name: 'Vĩnh Phúc' },
    { code: '25', name: 'Phú Thọ' },
    { code: '22', name: 'Quảng Ninh' },
    { code: '24', name: 'Bắc Giang' },
    { code: '19', name: 'Thái Nguyên' },
    { code: '33', name: 'Hưng Yên' },
    { code: '35', name: 'Hà Nam' },
    { code: '36', name: 'Nam Định' },
    { code: '37', name: 'Ninh Bình' },
    { code: '40', name: 'Nghệ An' },
    { code: '75', name: 'Đồng Nai' },
    { code: '74', name: 'Bình Dương' },
    { code: '72', name: 'Tây Ninh' },
    { code: '77', name: 'Bà Rịa - Vũng Tàu' }
].sort((a, b) => a.name.localeCompare(b.name));

// Sample districts for major cities (Full list would be too long, using sample)
export const DISTRICTS: Record<string, { code: string, name: string }[]> = {
    '01': [ // Hà Nội
        { code: '001', name: 'Ba Đình' },
        { code: '002', name: 'Hoàn Kiếm' },
        { code: '003', name: 'Tây Hồ' },
        { code: '004', name: 'Long Biên' },
        { code: '005', name: 'Cầu Giấy' },
        { code: '006', name: 'Đống Đa' },
        { code: '007', name: 'Hai Bà Trưng' },
        { code: '008', name: 'Hoàng Mai' },
        { code: '009', name: 'Thanh Xuân' },
        { code: '016', name: 'Bắc Từ Liêm' },
        { code: '019', name: 'Nam Từ Liêm' },
        { code: '018', name: 'Hà Đông' },
    ],
    '79': [ // HCM
        { code: '760', name: 'Quận 1' },
        { code: '769', name: 'Thủ Đức' },
        { code: '770', name: 'Gò Vấp' },
        { code: '765', name: 'Bình Thạnh' },
        { code: '766', name: 'Tân Bình' },
        { code: '767', name: 'Tân Phú' },
        { code: '768', name: 'Phú Nhuận' },
        { code: '771', name: 'Bình Tân' },
        { code: '772', name: 'Củ Chi' },
        { code: '773', name: 'Hóc Môn' },
        { code: '774', name: 'Bình Chánh' },
        { code: '775', name: 'Nhà Bè' },
        { code: '776', name: 'Cần Giờ' },
    ]
};

// Helper to get districts (fallback generic if missing)
export const getDistricts = (provinceCode: string) => {
    return DISTRICTS[provinceCode] || [
        { code: 'other', name: 'Quận/Huyện khác' }
    ];
};
