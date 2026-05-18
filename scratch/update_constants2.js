const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/constants.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove all `{ label: "Văn hóa doanh nghiệp", href: "/culture", icon: Heart },`
content = content.replace(/[ \t]*\{\s*label:\s*"Văn hóa doanh nghiệp".*?\},\r?\n/g, '');

// 2. Add it right after each `[ROLES.X]: [`
const cultureItem = '\n        { label: "Văn hóa doanh nghiệp", href: "/culture", icon: Heart },';
content = content.replace(/(\[ROLES\.[A-Z_]+\]:\s*\[)/g, `$1${cultureItem}`);

fs.writeFileSync(filePath, content);
console.log("Fixed constants.ts (clean)");
