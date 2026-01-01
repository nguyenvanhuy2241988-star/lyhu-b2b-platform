const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
    }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const email = 'nguyenvanhuy2241988@gmail.com';
const password = 'Bok201298@';

async function setAdmin() {
    console.log(`Logging in as ${email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error("Login failed:", error.message);
        return;
    }

    const userId = data.user.id;
    console.log(`Logged in. ID: ${userId}`);

    console.log("Updating role to 'admin'...");
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

    if (updateError) {
        console.error("Update failed:", updateError.message);
    } else {
        console.log("Success! Role updated to admin.");
    }
}

setAdmin();
