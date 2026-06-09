/**
 * Level 7: Harvest Simulation
 * This script inserts fake "Leads" into the staging table so you can test the Approval UI.
 */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Or SERVICE_ROLE if RLS blocks anon

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials in .env.local');
    console.log('Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MOCK_LEADS = [
    {
        name: 'Nguyễn Văn A',
        source: 'facebook_group',
        source_id: 'group_123_post_456',
        profile_url: 'https://facebook.com/nguyen.van.a',
        phone: '0912345678',
        raw_data: { interest: 'Mua sỉ', text: 'Inbox mình giá sỉ nhé shop' }
    },
    {
        name: 'Trần Thị B',
        source: 'profile_scan',
        source_id: 'uid_888888',
        profile_url: 'https://facebook.com/tranthib',
        phone: '0987654321',
        raw_data: { bio: 'Chuyên sỉ lẻ mỹ phẩm' }
    },
    {
        name: 'Le Van Spam (Bad Lead)',
        source: 'facebook_group',
        source_id: 'group_spam_1',
        profile_url: 'https://facebook.com/spammer',
        phone: null,
        raw_data: { text: 'Việc làm online thu nhập cao...' }
    }
];

async function runSimulation() {
    console.log('[SIM] Injecting 3 Mock Leads into Staging Area...');

    for (const lead of MOCK_LEADS) {
        const { error } = await supabase
            .from('marketing_leads_staging')
            .insert(lead);

        if (error) {
            console.error('[SIM] Insert Failed:', error.message);
        } else {
            console.log(`[SIM] ✅ Inserted: ${lead.name}`);
        }
    }

    console.log('[SIM] Done! Go to /marketing/leads to approve them.');
}

runSimulation();
