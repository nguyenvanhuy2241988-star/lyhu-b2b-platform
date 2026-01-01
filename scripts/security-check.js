const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSecurityTest() {
    console.log('=== SECURITY TEST START ===');

    // 1. Authenticate as a normal user (Telesales)
    // You should use a known test account or sign up a temporary one
    const email = 'telesales_test_' + Date.now() + '@example.com';
    const password = 'password123';

    console.log(`Creating test user: ${email}`);
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error('Sign up failed:', signUpError.message);
        // Try sign in if exists
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) {
            console.error('Sign in failed:', signInError.message);
            return;
        }
    }

    // Wait a bit for trigger
    await new Promise(r => setTimeout(r, 1000));

    const userId = (await supabase.auth.getUser()).data.user.id;
    console.log('Logged in as user ID:', userId);

    // 2. Try to change OWN role to admin
    console.log('Attempting to change role to "admin"...');
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

    if (updateError) {
        console.log('SUCCESS: Prevented role change. Error:', updateError.message);
    } else {
        // Verify if it actually changed (it might silently fail if policy allows update but trigger reverted, or if policy blocked it)
        // Check data
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (profile.role === 'admin') {
            console.error('FAILURE: User was able to change role to admin!');
        } else {
            console.log('SUCCESS: Role is still:', profile.role);
        }
    }

    // 3. Try to change other allowed fields
    console.log('Attempting to change "email" (valid field)...');
    // Note: changing email usually requires email verification or triggers separate logic, 
    // maybe we update metadata or another field if profiles has name?
    // The migration schema showed create table structure, it didn't strictly show other columns but likely 'email' is there.
    // Profiles table: id, email, role. Maybe add name if it exists?
    // Let's try updating 'updated_at' implicitly? Or if there is a name column.
    // The migration 20251219000100... shows: id, email, role, created_at, updated_at.
    // Converting email column? Actually email in profile is text.

    // Let's try to update email to same value just to trigger update?
    const { error: updateValidError } = await supabase
        .from('profiles')
        .update({ email: email })
        .eq('id', userId);

    if (updateValidError) {
        console.log('Warning: Could not update profile (maybe RLS blocks all updates?):', updateValidError.message);
    } else {
        console.log('INFO: Normal update request went through (permissions allowing).');
    }

    // Clean up? (Hard to delete user without admin key)
    console.log('=== SECURITY TEST END ===');
}

runSecurityTest();
