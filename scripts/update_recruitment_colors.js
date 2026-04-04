const fs = require('fs');
const path = require('path');

const dirs = [
    'G:/LYHU/Projects/LYHU-app/src/app/(dashboard)/recruitment',
    'G:/LYHU/Projects/LYHU-app/src/components/recruitment'
];

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Simple replacements
            content = content.replace(/bg-blue-/g, 'bg-primary-');
            content = content.replace(/text-blue-/g, 'text-primary-');
            content = content.replace(/border-blue-/g, 'border-primary-');
            content = content.replace(/ring-blue-/g, 'ring-primary-');
            
            // Fix shadows that might be too harsh or still reference blue
            content = content.replace(/shadow-blue-600\/20/g, 'shadow-primary-600/20');
            content = content.replace(/shadow-lg shadow-primary-600\/20 transition active:scale-\[0.98\]/g, 'shadow-sm transition active:scale-[0.98]');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

dirs.forEach(processDir);
console.log('Done!');
