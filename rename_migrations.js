const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));

let i = 1;
for (const file of files) {
    // Only match exactly 8 digits at the start
    const match = file.match(/^(\d{8})_(.+)$/);
    if (match) {
        const datePart = match[1];
        const rest = match[2];
        const suffix = String(i).padStart(6, '0');
        const newName = `${datePart}${suffix}_${rest}`;
        fs.renameSync(path.join(dir, file), path.join(dir, newName));
        console.log('Renamed', file, 'to', newName);
        i++;
    }
}
