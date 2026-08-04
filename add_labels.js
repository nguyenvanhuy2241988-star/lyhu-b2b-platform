const fs = require('fs');
const content = fs.readFileSync('src/components/admin/VietnamMapSVG.tsx', 'utf-8');

const nameRegex = /handleMouseEnter\("([^"]+)"\)/g;
const nameMatches = [...content.matchAll(nameRegex)];

let labels = [];

for (const match of nameMatches) {
    const name = match[1];
    const matchIndex = match.index;
    
    // Search backward from matchIndex to find the nearest d="..."
    const textBefore = content.substring(0, matchIndex);
    const dMatch = textBefore.match(/d="([^"]+)"(?=[^d]*$)/);
    
    if (!dMatch) continue;
    
    const d = dMatch[1];
    
    const numRegex = /-?\d+(\.\d+)?/g;
    const nums = [...d.matchAll(numRegex)].map(m => parseFloat(m[0]));

    if (nums.length < 2) continue;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

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

    if (name === "Thanh Hóa") cy += 5;
    if (name === "Nghệ An") cx += 5;
    if (name === "Hà Tĩnh") { cx += 5; cy += 5; }
    if (name === "Quảng Bình") cx += 3;
    
    let displayName = name;
    if (displayName === "Bà Rịa - Vũng Tàu") displayName = "BR-VT";
    if (displayName === "Thừa Thiên Huế") displayName = "TT-Huế";
    if (displayName === "TP Hồ Chí Minh" || displayName === "Hồ Chí Minh") displayName = "TP.HCM";

    labels.push(`                <text x="${cx}" y="${cy}" textAnchor="middle" dominantBaseline="central" className="pointer-events-none fill-slate-800 font-bold" style={{ fontSize: '6px', textShadow: '0px 0px 2px white, 0px 0px 2px white' }}>${displayName}</text>`);
}

let newContent = content;
// Remove old labels if any
newContent = newContent.replace(/\s*\{\/\* Province Labels \*\/\}\s*(<text[\s\S]*?<\/text>\s*)*\s*<\/g>/, '\n            </g>');

const splitIndex = newContent.lastIndexOf('</g>');
if (splitIndex !== -1) {
    newContent = newContent.substring(0, splitIndex) + '\n                {/* Province Labels */}\n' + labels.join('\n') + '\n            ' + newContent.substring(splitIndex);
    fs.writeFileSync('src/components/admin/VietnamMapSVG.tsx', newContent, 'utf-8');
    console.log("Labels generated: " + labels.length);
} else {
    console.log("Could not find </g>");
}
