const fs = require('fs');
let content = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Remove existing 'Văn hóa doanh nghiệp' lines
content = content.replace(/\s*\{\s*label:\s*"Văn hóa doanh nghiệp",\s*href:\s*"\/culture",\s*icon:\s*Heart\s*\},/g, '');

// Insert it right after the first item (usually 'Tổng quan') for each role
// A role array starts with '[ROLES.SOME_ROLE]: ['
content = content.replace(/(\[ROLES\.[A-Z_]+\]:\s*\[\s*\n\s*)(\{.*?\},)/g, '$1$2\n        { label: "Văn hóa doanh nghiệp", href: "/culture", icon: Heart },');

fs.writeFileSync('src/lib/constants.ts', content);
console.log('Updated constants.ts');
