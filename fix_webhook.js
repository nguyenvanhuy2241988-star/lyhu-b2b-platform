const fs = require('fs');
const file = 'g:\\LYHU\\Projects\\LYHU-app\\src\\app\\api\\facebook\\webhook\\route.ts';
let c = fs.readFileSync(file, 'utf8');

// Replace the manual phone regex with extractPhoneNumber call
const old = `                            // Auto-detect Vietnamese phone numbers from customer messages
                            // Strip dots, spaces, dashes for formats like 0933.661.095
                            const cleanedText = text.replace(/[\\.\\s\\-]/g, '');
                            const phoneRegex = /(0[35789])([0-9]{8})\\b/g;
                            const phoneMatch = cleanedText.match(phoneRegex);
                            if (phoneMatch) {
                                upsertData.customer_phone = phoneMatch[0];
                            }`;

const replacement = `                            // Auto-detect Vietnamese phone numbers (uses same robust regex as AI)
                            const detectedPhone = extractPhoneNumber(text);
                            if (detectedPhone) {
                                upsertData.customer_phone = detectedPhone;
                            }`;

if (c.includes(old)) {
    c = c.replace(old, replacement);
    fs.writeFileSync(file, c, 'utf8');
    console.log('SUCCESS');
} else {
    // Try with different line endings
    const oldLF = old.replace(/\r\n/g, '\n');
    const cLF = c.replace(/\r\n/g, '\n');
    if (cLF.includes(oldLF)) {
        const result = cLF.replace(oldLF, replacement.replace(/\r\n/g, '\n'));
        const final = c.includes('\r\n') ? result.replace(/\n/g, '\r\n') : result;
        fs.writeFileSync(file, final, 'utf8');
        console.log('SUCCESS (LF normalized)');
    } else {
        console.log('NOT FOUND');
        // Show what's actually at that location
        const idx = c.indexOf('Auto-detect Vietnamese phone');
        console.log('Index:', idx);
        if (idx > 0) console.log('Context:', JSON.stringify(c.substring(idx, idx + 400)));
    }
}
