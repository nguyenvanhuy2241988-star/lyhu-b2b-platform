import { provinceDemographics } from './src/lib/demographics.js';
import fetch from 'node-fetch'; // need to run with right context or just use built in fetch if Node 18+

const quangNinhTargets = {
    "Khoai môn CVT (Karaoke)": 40000000,
    "Khoai môn CVT (Siêu thị)": 80000000,
    "Abi Snack": 50000000,
    "Kẹo UHi": 30000000
};

function calculateDynamicTarget(provinceName, brand) {
    const baseTarget = quangNinhTargets[brand] || 30000000;
    const demo = provinceDemographics[provinceName];
    const baseDemo = provinceDemographics["Quảng Ninh"];
    
    if (!demo || !baseDemo) return baseTarget;

    const popRatio = demo.population / baseDemo.population;
    const gdpRatio = demo.gdp / baseDemo.gdp;
    const incomeRatio = demo.perCapitaIncome / baseDemo.perCapitaIncome;
    const areaRatio = demo.area / baseDemo.area;

    const scaleFactor = (popRatio * 0.40) + (gdpRatio * 0.40) + (incomeRatio * 0.15) + (areaRatio * 0.05);

    return Math.round((baseTarget * scaleFactor) / 100000) * 100000;
}

async function run() {
    // We don't have access to the DB directly from this simple script without env vars.
    // However, since we updated the getProvinceData in the app, any frontend user loading it will STILL see the old DB values if they were saved.
    console.log("Just running a test to see values:");
    console.log("Hanoi Karaoke Target:", calculateDynamicTarget("Hà Nội", "Khoai môn CVT (Karaoke)"));
    console.log("Lai Chau Karaoke Target:", calculateDynamicTarget("Lai Châu", "Khoai môn CVT (Karaoke)"));
}

run();
