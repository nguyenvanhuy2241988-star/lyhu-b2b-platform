export interface ProvinceData {
    hasNPP: boolean;
    targets: {
        "Khoai môn CVT"?: number;
        "Kẹo UHi"?: number;
        "Abi Snack"?: number;
        [key: string]: number | undefined;
    };
}

export const defaultTargets = {
    CVT: 50000000,
    UHi: 20000000,
    AbiSnack: 30000000
};

export const nppData: Record<string, ProvinceData> = {
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
    "Bắc Ninh": {
        hasNPP: true,
        targets: {
            "Khoai môn CVT": 60000000,
            "Kẹo UHi": 25000000,
            "Abi Snack": 40000000
        }
    }
};

export function getProvinceData(provinceName: string): ProvinceData {
    if (provinceName === "Hồ Chí Minh") provinceName = "TP Hồ Chí Minh";
    
    if (nppData[provinceName]) {
        return nppData[provinceName];
    }
    
    return {
        hasNPP: false,
        targets: {
            "Khoai môn CVT": defaultTargets.CVT,
            "Kẹo UHi": defaultTargets.UHi,
            "Abi Snack": defaultTargets.AbiSnack
        }
    };
}
