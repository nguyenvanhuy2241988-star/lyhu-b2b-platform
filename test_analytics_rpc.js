require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  console.log("Calling get_analytics_summary...");
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date().toISOString();
  
  const { data, error } = await supabase.rpc('get_analytics_summary', {
    start_date: startDate,
    end_date: endDate,
    exclude_internal: true
  });
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Device Breakdown:");
  console.log(data.deviceBreakdown);
  
  console.log("\nTop Referrers:");
  console.log(data.topReferrers);
}

testRpc();
