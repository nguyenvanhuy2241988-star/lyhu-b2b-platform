// Script to subscribe all connected Facebook Pages to webhook
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: pages, error } = await supabase
        .from('facebook_pages')
        .select('page_id, name, access_token')
        .eq('is_connected', true);

    if (error) {
        console.error('Error fetching pages:', error.message);
        return;
    }

    console.log(`Found ${pages.length} connected pages\n`);

    for (const page of pages) {
        console.log(`Subscribing: ${page.name} (${page.page_id})...`);

        const url = `https://graph.facebook.com/v19.0/${page.page_id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed,message_echoes&access_token=${page.access_token}`;

        try {
            const res = await fetch(url, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                console.log(`  ✅ OK\n`);
            } else {
                console.log(`  ❌ Error:`, JSON.stringify(data.error || data), '\n');
            }
        } catch (e) {
            console.log(`  ❌ Failed:`, e.message, '\n');
        }
    }

    console.log('Done!');
}

main();
