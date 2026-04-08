const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wepxcpifgxghfvdgnkeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcHhjcGlmZ3hnaGZ2ZGdua2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTQxNjEsImV4cCI6MjA4MTU3MDE2MX0.IF7YiJlCdAjSkAUAZjRtKn_QF8Q8MMAIQXsWyMVYzAY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    // 1. Check company_ips config
    const { data: cfg } = await supabase
        .from('lead_distribution_config')
        .select('company_ips, only_company_ip')
        .eq('id', 1)
        .single();
    console.log('=== CONFIG ===');
    console.log('only_company_ip:', cfg?.only_company_ip);
    console.log('company_ips:', JSON.stringify(cfg?.company_ips));

    // 2. Check current_ip of online users
    const { data: users, error } = await supabase.rpc('get_users_activity_stats');
    if (error) {
        console.error('RPC error:', error);
        return;
    }
    console.log('\n=== ONLINE USERS & IPs ===');
    const columns = Object.keys(users[0] || {});
    console.log('Columns returned:', columns);
    console.log('Has current_ip column:', columns.includes('current_ip'));
    
    const onlineUsers = users.filter(u => u.is_online);
    onlineUsers.forEach(u => {
        const ipMatch = cfg?.company_ips?.includes(u.current_ip);
        console.log(`  ${u.full_name} | role: ${u.role} | ip: "${u.current_ip}" | match: ${ipMatch}`);
    });

    // 3. Check raw user_daily_activities for today
    const { data: uda } = await supabase
        .from('user_daily_activities')
        .select('user_id, current_ip, last_seen')
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    console.log('\n=== RAW user_daily_activities (last 5min) ===');
    (uda || []).forEach(r => {
        const name = onlineUsers.find(u => u.user_id === r.user_id)?.full_name || r.user_id;
        console.log(`  ${name} | ip: "${r.current_ip}"`);
    });
}

debug();
