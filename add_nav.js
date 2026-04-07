const fs = require('fs');

let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

if (!code.includes('Heart,')) {
    code = code.replace('} from "lucide-react";', '    Heart,\n} from "lucide-react";');
}

let lines = code.split('\n');
let inNavItems = false;
let outputLines = [];

for (let i=0; i<lines.length; i++) {
    let currLine = lines[i];
    if (currLine.includes('export const NAV_ITEMS = {')) {
        inNavItems = true;
    }
    
    // Condition to insert:
    // Insert before { label: "Sự kiện", href: "/events", icon: Calendar }
    // Or if role doesn't have events, before "Tài liệu"
    
    // Some roles have "Sự kiện", some have "Tài liệu". 
    // Wait, almost all have "Tin nhắn nội bộ", "Sự kiện", "Tài liệu".
    // I'll insert it right after "Tin nhắn nội bộ" because everyone has it?
    // Let's insert before "Sự kiện" or "Tài liệu" whichever comes first.
    // So if the line contains "Sự kiện", insert before it and flag that we inserted it for this block.
    // It's easier: just replace `label: "Sự kiện"` with Culture + Sự kiện.
    if (inNavItems && currLine.includes('"Sự kiện"')) {
        if (!outputLines[outputLines.length - 1].includes('Văn hóa doanh nghiệp')) {
            outputLines.push('        { label: "Văn hóa doanh nghiệp", href: "/culture", icon: Heart },');
        }
    } else if (inNavItems && currLine.includes('"Tài liệu"')) {
        // Only insert if we haven't just inserted for "Sự kiện"
        if (!outputLines[outputLines.length - 1].includes('"Sự kiện"') && !outputLines[outputLines.length - 1].includes('Văn hóa doanh nghiệp') && !outputLines[outputLines.length - 2]?.includes('Văn hóa doanh nghiệp')) {
            outputLines.push('        { label: "Văn hóa doanh nghiệp", href: "/culture", icon: Heart },');
        }
    }
    
    outputLines.push(currLine);
}

fs.writeFileSync('src/lib/constants.ts', outputLines.join('\n'));
console.log('Added NAV items successfully!');
