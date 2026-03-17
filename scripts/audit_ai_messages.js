// Quick script to audit AI chatbot messages
// Run: node scripts/audit_ai_messages.js

const { createClient } = require('@supabase/supabase-js');

// Load env from .env or .env.local 
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    // Get recent AI messages (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: aiMessages, error } = await supabase
        .from('social_messages')
        .select('id, conversation_id, content, created_at, is_from_page')
        .or('content.ilike.[AI]:%,content.ilike.[AI Follow-up%,content.ilike.[Bot]:%')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        console.error('Query error:', error);
        return;
    }

    console.log(`Found ${aiMessages.length} AI messages in last 7 days\n`);

    // Group by conversation
    const convIds = [...new Set(aiMessages.map(m => m.conversation_id))];
    console.log(`Across ${convIds.length} conversations\n`);

    // For each conversation, get the full recent history
    for (const convId of convIds.slice(0, 30)) { // Limit to 30 conversations
        // Get conversation info
        const { data: conv } = await supabase
            .from('social_conversations')
            .select('customer_name, customer_phone, needs_followup, followup_count, source_type')
            .eq('id', convId)
            .single();

        if (!conv) continue;

        // Get messages for this conversation
        const { data: msgs } = await supabase
            .from('social_messages')
            .select('content, is_from_page, created_at')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true })
            .limit(20);

        if (!msgs || msgs.length === 0) continue;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`Customer: ${conv.customer_name}`);
        console.log(`Phone: ${conv.customer_phone || 'NONE'}`);
        console.log(`Needs Followup: ${conv.needs_followup}`);
        console.log(`Followup Count: ${conv.followup_count || 0}`);
        console.log(`Source: ${conv.source_type || 'organic'}`);
        console.log(`${'='.repeat(60)}`);

        for (const msg of msgs) {
            const sender = msg.is_from_page ? '  🤖 BOT' : '  👤 KH';
            const time = new Date(msg.created_at).toLocaleString('vi-VN');
            const content = msg.content.substring(0, 200);
            console.log(`${sender} [${time}]: ${content}`);
        }
    }
}

audit().catch(console.error);
