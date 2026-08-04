const fs = require('fs');

const content = fs.readFileSync('src/components/admin/VietnamMapSVG.tsx', 'utf-8');

// Find all paths
const pathRegex = /<path[\s\S]*?d="([^"]+)"[\s\S]*?onMouseEnter=\{\(\) => handleMouseEnter\("([^"]+)"\)\}[\s\S]*?\/>/g;
const matches = [...content.matchAll(pathRegex)];

let labels = [];

for (const match of matches) {
    const d = match[1];
    const name = match[2];

    // Extract all numbers
    const numRegex = /-?\d+(\.\d+)?/g;
    const nums = [...d.matchAll(numRegex)].map(m => parseFloat(m[0]));

    if (nums.length < 2) continue;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    // Pairs of X, Y. In SVG paths, they usually alternate. 
    // This is a naive but surprisingly effective approximation for map polygons
    for (let i = 0; i < nums.length; i += 2) {
        if (i + 1 < nums.length) {
            const x = nums[i];
            const y = nums[i+1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }

    let cx = (minX + maxX) / 2;
    let cy = (minY + maxY) / 2;

    // Manual adjustments for specific problematic provinces that are long or curved
    if (name === "Thanh Hóa") cy += 5;
    if (name === "Nghệ An") cx += 5;
    if (name === "Hà Tĩnh") { cx += 5; cy += 5; }
    if (name === "Quảng Bình") cx += 3;
    
    // Convert long names or make them fit better
    let displayName = name;
    if (displayName === "Bà Rịa - Vũng Tàu") displayName = "BR-VT";
    if (displayName === "Thừa Thiên Huế") displayName = "TT-Huế";
    if (displayName === "TP Hồ Chí Minh" || displayName === "Hồ Chí Minh") displayName = "TP.HCM";

    labels.push(`                <text x="${cx}" y="${cy}" textAnchor="middle" dominantBaseline="central" className="pointer-events-none fill-slate-800 font-bold" style={{ fontSize: '3px', textShadow: '0px 0px 2px white, 0px 0px 2px white' }}>${displayName}</text>`);
}

// Inject labels before the closing </g>
if (!content.includes('textAnchor="middle"')) {
    const splitIndex = content.lastIndexOf('</g>');
    if (splitIndex !== -1) {
        const newContent = content.substring(0, splitIndex) + '\n                {/* Province Labels */}\n' + labels.join('\n') + '\n            ' + content.substring(splitIndex);
        fs.writeFileSync('src/components/admin/VietnamMapSVG.tsx', newContent, 'utf-8');
        console.log("Labels injected.");
    }
} else {
    console.log("Labels already injected.");
}
