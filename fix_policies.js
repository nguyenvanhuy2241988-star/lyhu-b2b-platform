const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.startsWith('202512') && f.endsWith('.sql'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let code = fs.readFileSync(filePath, 'utf8');

    // We want to match: create policy "Policy Name" on [public.]table_name
    const regex = /create policy\s+"([^"]+)"\s*(?:for\s+[a-z]+\s*)?on\s+([a-zA-Z0-9_\.]+)/gi;

    // Some formats: CREATE POLICY "..." ON table_name
    const regex2 = /create policy\s+"([^"]+)"\s+on\s+([a-zA-Z0-9_\.]+)/gi;

    let changed = false;

    // First apply regex2 (standard format) or both. Actually regex2 handles `CREATE POLICY "NAME" ON TABLE`
    // Wait, what if it's `create policy "NAME" for select on TABLE`? No, standard postgres is `ON table FOR select`. 
    // Wait, my regex `on\s+([a-zA-Z0-9_\.]+)` captures the table name.

    let newCode = code.replace(regex2, (match, policyName, tableName) => {
        const dropStmt = 'drop policy if exists "' + policyName + '" on ' + tableName + ';';
        // if already has drop statement for this policy (even roughly), skip
        if (code.includes('drop policy if exists "' + policyName + '"')) {
            return match;
        }
        changed = true;
        return dropStmt + '\n' + match;
    });

    // What if it's `ON public.table FOR SELECT`?
    // Matches regex2 because `ON public.table` followed by `FOR SELECT`

    if (changed) {
        fs.writeFileSync(filePath, newCode, 'utf8');
        console.log('Fixed:', file);
    }
}
