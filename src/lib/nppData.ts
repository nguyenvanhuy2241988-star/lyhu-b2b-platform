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

// Base targets for Quảng Ninh
export const quangNinhTargets: Record<string, number> = {
    "Khoai môn CVT (Karaoke)": 40000000,
    "Khoai môn CVT (Siêu thị)": 80000000,
    "Abi Snack": 50000000,
    "Kẹo UHi": 30000000
};

import { provinceDemographics } from "./demographics";

function calculateDynamicTarget(provinceName: string, brand: string): number {
    const baseTarget = quangNinhTargets[brand] || 30000000;
    
    // Default to base target if demographics are missing (e.g. invalid name)
    const demo = provinceDemographics[provinceName];
    const baseDemo = provinceDemographics["Quảng Ninh"];
    
    if (!demo || !baseDemo) {
        return baseTarget;
    }

    // Calculate scale factor using weighted average of demographics
    // Population: 40%, GRDP: 40%, Income: 15%, Area: 5%
    const popRatio = demo.population / baseDemo.population;
    const gdpRatio = demo.gdp / baseDemo.gdp;
    const incomeRatio = demo.perCapitaIncome / baseDemo.perCapitaIncome;
    const areaRatio = demo.area / baseDemo.area;

    const scaleFactor = (popRatio * 0.40) + (gdpRatio * 0.40) + (incomeRatio * 0.15) + (areaRatio * 0.05);

    // Calculate the final target, rounded to the nearest 100,000 VNĐ for cleanliness
    const rawTarget = baseTarget * scaleFactor;
    return Math.round(rawTarget / 100000) * 100000;
}

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
                target: calculateDynamicTarget(provinceName, brand),
                currentSales: 0,
                hasNPP: false
            };
        } else if (!updatedBrands[brand].target || updatedBrands[brand].target === 0) {
            // Also update targets for existing records if their target is 0 or missing
            updatedBrands[brand].target = calculateDynamicTarget(provinceName, brand);
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
