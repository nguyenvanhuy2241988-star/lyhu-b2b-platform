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

            // Fix overview gradient
            content = content.replace(/bg-gradient-to-br from-blue-600 to-indigo-700/g, 'bg-primary-600');
            content = content.replace(/bg-gradient-to-br from-primary-600 to-indigo-700/g, 'bg-primary-600');
            content = content.replace(/bg-gradient-to-r from-blue-500 to-indigo-600/g, 'bg-primary-600');
            
            // Other blue variants
            content = content.replace(/from-blue-/g, 'from-primary-');
            content = content.replace(/to-blue-/g, 'to-primary-');
            content = content.replace(/to-indigo-/g, 'to-primary-');

            // Fix dark slate buttons
            content = content.replace(/bg-slate-900/g, 'bg-primary-600');
            content = content.replace(/hover:bg-slate-800/g, 'hover:bg-primary-700');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

dirs.forEach(processDir);
console.log('Done additional fixes!');
