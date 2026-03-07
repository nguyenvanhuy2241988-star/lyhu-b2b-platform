const fs = require('fs');
const path = require('path');
const file = path.join('g:', 'LYHU', 'Projects', 'LYHU-app', 'src', 'lib', 'geminiService.ts');
let content = fs.readFileSync(file, 'utf8');

// Find and replace the function
const oldPattern = /export function extractPhoneNumber\(text: string\): string \| null \{[\s\S]*?return match \? match\[0\] : null;\s*\}/;

const newFn = `export function extractPhoneNumber(text: string): string | null {
    if (!text) return null;
    // Match 0[35789] followed by 8 more digits, allowing any dots/spaces/dashes between digits
    // Handles: 0933661095, 0933.661.095, 0933 661 095, 0933-661-095, 0933 661.095, 076 2225651
    const s = '[\\\\s.\\\\-]*';
    const pattern = new RegExp(\`0[35789]\${s}\\\\d\${s}\\\\d\${s}\\\\d\${s}\\\\d\${s}\\\\d\${s}\\\\d\${s}\\\\d\${s}\\\\d\`, 'g');
    const match = text.match(pattern);
    if (match) {
        return match[0].replace(/\\D/g, '');
    }
    return null;
}`;

if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newFn);
    fs.writeFileSync(file, content, 'utf8');
    console.log('SUCCESS');
} else {
    console.log('ERROR: pattern not found');
}
