// data.js
const defaultTargets = {
    CVT: 50000000,
    UHi: 20000000,
    AbiSnack: 30000000
};

// Dữ liệu mẫu. Những tỉnh không có trong danh sách này sẽ được coi là "Còn trống" 
// và dùng chỉ tiêu mặc định
const nppData = {
    "Quảng Ninh": {
        hasNPP: true,
        targets: {
            "Khoai môn CVT": 70000000,
            "Kẹo UHi": 30000000,
            "Abi Snack": 50000000
        }
    },
    "Hà Nội": {
        hasNPP: true,
        targets: {
            "Khoai môn CVT": 150000000,
            "Kẹo UHi": 80000000,
            "Abi Snack": 100000000
        }
    },
    "TP Hồ Chí Minh": {
        hasNPP: true,
        targets: {
            "Khoai môn CVT": 200000000,
            "Kẹo UHi": 100000000,
            "Abi Snack": 150000000
        }
    },
    "Đà Nẵng": {
        hasNPP: true,
        targets: {
            "Khoai môn CVT": 60000000,
            "Kẹo UHi": 25000000,
            "Abi Snack": 40000000
        }
    },
    "Hải Phòng": {
        hasNPP: false, // Còn trống
        targets: {
            "Khoai môn CVT": 80000000,
            "Kẹo UHi": 40000000,
            "Abi Snack": 60000000
        }
    }
    // ... có thể thêm các tỉnh khác
};

// Hàm tiện ích format tiền
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Lấy dữ liệu cho một tỉnh
function getProvinceData(provinceName) {
    // Xử lý một số khác biệt tên gọi nếu có
    if (provinceName === "Hồ Chí Minh") provinceName = "TP Hồ Chí Minh";
    
    if (nppData[provinceName]) {
        return nppData[provinceName];
    }
    
    // Nếu không có trong data mẫu, trả về mặc định (Còn trống)
    return {
        hasNPP: false,
        targets: {
            "Khoai môn CVT": defaultTargets.CVT,
            "Kẹo UHi": defaultTargets.UHi,
            "Abi Snack": defaultTargets.AbiSnack
        }
    };
}
