const fs = require('fs'); 
const content = fs.readFileSync('src/components/admin/VietnamMapSVG.tsx', 'utf8'); 
const matches = [...content.matchAll(/handleMouseEnter\("([^"]+)"\)/g)].map(m => m[1]); 
console.log(matches.filter(m => m.includes('Phòng')));
