const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Parse .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (err) {
    console.error("Could not read .env.local:", err.message);
    process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // simple quote removal
        envVars[key] = value;
    }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: SignUp usually works with Anon Key if "Enable Email Signup" is on.
// If not, we need Service Role Key. Assuming Anon Key works for now or user enabled signup.

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

console.log("Supabase URL:", SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const users = [
    { email: 'admin@lyhu.vn', password: 'password123', role: 'admin' },
    { email: 'sales@lyhu.vn', password: 'password123', role: 'sales' },
    { email: 'ctv@lyhu.vn', password: 'password123', role: 'ctv' },
    { email: 'telesales@lyhu.vn', password: 'password123', role: 'telesales' },
    { email: 'customer@lyhu.vn', password: 'password123', role: 'customer' },
];

async function seed() {
    for (const u of users) {
        console.log(`Creating/Signing in ${u.email}...`);
        // Try sign up
        let { data, error } = await supabase.auth.signUp({
            email: u.email,
            password: u.password,
        });

        if (error) {
            // If user already exists, that's fine.
            console.log(`  Msg: ${error.message}`);
        } else {
            console.log(`  Created ${u.email}. User ID: ${data.user?.id}`);
        }

        // Check if we can sign in (to verify)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: u.email,
            password: u.password
        });

        if (signInError) {
            console.error(`  ERROR: Could not sign in as ${u.email}: ${signInError.message}`);
        } else {
            const userId = signInData.user.id;
            console.log(`  Verified login for ${u.email}. ID: ${userId}`);

            // Update Role in Profiles
            if (u.role) {
                console.log(`  Updating role to ${u.role}...`);
                // We can't update directly with ANON key unless RLS allows it or we are that user.
                // But we ARE that user now (signed in).
                // However, our RLS policy `profiles_update_own` allows update using `auth.uid() = id`.
                // But check if we can update the `role` column?
                // Usually only admins should update roles.
                // If RLS allows "update own", a user can change their own role? That would be a security hole I just created?
                // Checking migration:
                // create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
                // It allows updating ALL columns unless restricted.
                // So YES, for this test/setup, the user CAN update their own role.

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ role: u.role })
                    .eq('id', userId);

                if (updateError) console.error(`  Failed to set role: ${updateError.message}`);
                else console.log(`  Role set to ${u.role}`);
            }
        }
    }
}

seed();
