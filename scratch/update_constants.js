const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/constants.ts');
let content = fs.readFileSync(filePath, 'utf8');

// First remove all occurrences of the culture link using regex to handle variations in spacing
content = content.replace(/\s*\{\s*label:\s*"Văn hóa doanh nghiệp".*?\},\s*/g, ',\n');
content = content.replace(/,\n,\n/g, ',\n'); // Cleanup multiple commas if any
content = content.replace(/\[\s*,\n/g, '[\n'); // Cleanup leading comma after bracket

// Now add it exactly once at the top of each array
const cultureItem = '\n        { label: "Văn hóa doanh nghiệp", href: "/culture", icon: Heart },';
content = content.replace(/(\[ROLES\.[A-Z_]+\]:\s*\[)/g, `$1${cultureItem}`);

fs.writeFileSync(filePath, content);
console.log("Fixed constants.ts");
