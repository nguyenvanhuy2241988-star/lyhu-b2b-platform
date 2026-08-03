const fs = require('fs');
let content = fs.readFileSync('src/components/admin/VietnamMapSVG.tsx', 'utf8');
content = content.replace(/handleMouseEnter\("([^"]+)"\)\}[\s\S]*?fill=\{isCovered\(\) \?/g, (match, p1) => {
    return match.replace('isCovered()', 'isCovered("' + p1 + '")');
});
fs.writeFileSync('src/components/admin/VietnamMapSVG.tsx', content);
