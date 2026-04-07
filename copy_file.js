const fs = require('fs');
const contentMdPath = 'C:\\\\Users\\\\Huy\\\\.gemini\\\\antigravity\\\\brain\\\\4704c606-5402-4c6c-bf90-781c1640dbe4\\\\.system_generated\\\\steps\\\\854\\\\content.md';
let content = fs.readFileSync(contentMdPath, 'utf8');

// Strip out the system prefix
const parts = content.split('\\n---\\n\\n');
if (parts.length > 1) {
    fs.writeFileSync('src/app/(dashboard)/culture/page.tsx', parts.slice(1).join('\\n---\\n\\n'));
    console.log("Successfully directly written page.tsx");
}
