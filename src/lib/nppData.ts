export interface BrandTarget {
    target: number;
    currentSales: number;
    hasNPP: boolean;
}

export interface ProvinceData {
    brands: Record<string, BrandTarget>;
    telesales?: string;
}

export const telesalesStaff = [
    "Chưa phân công",
    "Nguyễn Văn A",
    "Trần Thị B",
    "Lê Văn C",
    "Phạm Thị D",
    "Hoàng Văn E"
];

export const defaultBrands = ["Khoai môn CVT (Karaoke)", "Khoai môn CVT (Siêu thị)", "Kẹo UHi", "Abi Snack"];

export const defaultTargets: Record<string, number> = {
    "Khoai môn CVT (Karaoke)": 30000000,
    "Khoai môn CVT (Siêu thị)": 30000000,
    "Kẹo UHi": 20000000,
    "Abi Snack": 30000000
};

// Dữ liệu mẫu ban đầu
export const initialNppData: Record<string, ProvinceData> = {
    "Quảng Ninh": {
        brands: {
            "Khoai môn CVT (Karaoke)": { target: 35000000, currentSales: 7500000, hasNPP: true },
            "Khoai môn CVT (Siêu thị)": { target: 35000000, currentSales: 7500000, hasNPP: true },
            "Kẹo UHi": { target: 30000000, currentSales: 5000000, hasNPP: true },
            "Abi Snack": { target: 50000000, currentSales: 0, hasNPP: false }
        }
    },
    "Hà Nội": {
        brands: {
            "Khoai môn CVT (Karaoke)": { target: 75000000, currentSales: 50000000, hasNPP: true },
            "Khoai môn CVT (Siêu thị)": { target: 75000000, currentSales: 50000000, hasNPP: true },
            "Kẹo UHi": { target: 80000000, currentSales: 60000000, hasNPP: true },
            "Abi Snack": { target: 100000000, currentSales: 80000000, hasNPP: true }
        }
    },
    "TP Hồ Chí Minh": {
        brands: {
            "Khoai môn CVT (Karaoke)": { target: 100000000, currentSales: 75000000, hasNPP: true },
            "Khoai môn CVT (Siêu thị)": { target: 100000000, currentSales: 75000000, hasNPP: true },
            "Kẹo UHi": { target: 100000000, currentSales: 90000000, hasNPP: true },
            "Abi Snack": { target: 150000000, currentSales: 100000000, hasNPP: true }
        }
    },
    "Bắc Ninh": {
        brands: {
            "Khoai môn CVT (Karaoke)": { target: 30000000, currentSales: 15000000, hasNPP: true },
            "Khoai môn CVT (Siêu thị)": { target: 30000000, currentSales: 15000000, hasNPP: true },
            "Kẹo UHi": { target: 25000000, currentSales: 10000000, hasNPP: true },
            "Abi Snack": { target: 40000000, currentSales: 5000000, hasNPP: false }
        }
    }
};

export function getProvinceData(dataStore: Record<string, ProvinceData>, provinceName: string): ProvinceData {
    if (provinceName === "Hồ Chí Minh") provinceName = "TP Hồ Chí Minh";
    
    let provinceData = dataStore[provinceName] || { brands: {} };
    
    const updatedBrands: Record<string, BrandTarget> = { ...provinceData.brands };

    // Migrate old data if present
    if (updatedBrands["Khoai môn CVT"]) {
        const oldData = updatedBrands["Khoai môn CVT"];
        if (!updatedBrands["Khoai môn CVT (Karaoke)"]) {
            updatedBrands["Khoai môn CVT (Karaoke)"] = {
                target: Math.round(oldData.target / 2),
                currentSales: Math.round(oldData.currentSales / 2),
                hasNPP: oldData.hasNPP
            };
        }
        if (!updatedBrands["Khoai môn CVT (Siêu thị)"]) {
            updatedBrands["Khoai môn CVT (Siêu thị)"] = {
                target: Math.round(oldData.target / 2),
                currentSales: Math.round(oldData.currentSales / 2),
                hasNPP: oldData.hasNPP
            };
        }
        delete updatedBrands["Khoai môn CVT"];
    }

    // Ensure all defaultBrands exist
    defaultBrands.forEach(brand => {
        if (!updatedBrands[brand]) {
            updatedBrands[brand] = {
                target: defaultTargets[brand] || 0,
                currentSales: 0,
                hasNPP: false
            };
        }
    });

    return {
        ...provinceData,
        brands: updatedBrands
    };
}

export async function saveNppDataToAPI(data: Record<string, ProvinceData>) {
    try {
        const res = await fetch('/api/admin/npp-targets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) {
            console.error("Failed to save NPP data");
        }
        return await res.json();
    } catch (e) {
        console.error("Error saving NPP data to API:", e);
    }
}

export async function fetchNppDataFromAPI(): Promise<Record<string, ProvinceData>> {
    try {
        const res = await fetch('/api/admin/npp-targets');
        if (res.ok) {
            const data = await res.json();
            return data || {};
        }
    } catch (e) {
        console.error("Failed to fetch NPP data from API", e);
    }
    return {};
}
