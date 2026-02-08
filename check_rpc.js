const { createClient } = require('@supabase/supabase-js');

// Hardcoded from .env.local
const supabaseUrl = 'https://wepxcpifgxghfvdgnkeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcHhjcGlmZ3hnaGZ2ZGdua2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTQxNjEsImV4cCI6MjA4MTU3MDE2MX0.IF7YiJlCdAjSkAUAZjRtKn_QF8Q8MMAIQXsWyMVYzAY'; // Using ANON KEY for RPC calls (should be allowed if configured)

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Fetching users via RPC...');
    const { data, error } = await supabase.rpc('get_users_activity_stats');

    if (error) {
        console.error('Error calling RPC:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('RPC Call Successful. Row count:', data.length);
        const firstRow = data[0];
        console.log('Columns in first row:', Object.keys(firstRow));

        const hasCode = Object.keys(firstRow).includes('misa_employee_code');
        console.log('Has misa_employee_code column?', hasCode);

        if (hasCode) {
            const withCode = data.find(u => u.misa_employee_code);
            if (withCode) {
                console.log('Found row with data:', withCode.email, '=>', withCode.misa_employee_code);
            } else {
                console.log('Column exists but all values are null/empty.');
            }
        }
    } else {
        console.log('RPC returned no data.');
    }
}

check();
