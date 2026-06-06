require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Fetching analytics data...');
  const { data: views, error } = await supabase
    .from('website_page_views')
    .select('id, referrer, user_agent, is_bot');

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(`Found ${views.length} rows to process.`);

  let updatedReferrers = 0;
  let updatedBots = 0;

  for (const view of views) {
    let updates = {};

    // Check bots
    if (!view.is_bot && view.user_agent) {
      const lowerUA = view.user_agent.toLowerCase();
      if (
        lowerUA.includes("bot") || lowerUA.includes("crawler") || lowerUA.includes("spider") ||
        lowerUA.includes("vercel") || lowerUA.includes("lighthouse") || lowerUA.includes("headless") ||
        lowerUA.includes("postman") || lowerUA.includes("curl") || lowerUA.includes("python") ||
        lowerUA.includes("node-fetch") || lowerUA.includes("undici") || lowerUA.includes("axios") ||
        lowerUA.includes("healthcheck") || lowerUA.includes("uptime")
      ) {
        updates.is_bot = true;
        updates.bot_name = "Generic Bot / Tool";
        updatedBots++;
      }
    }

    // Check referrers
    if (view.referrer) {
      try {
        const refUrl = new URL(view.referrer);
        const host = refUrl.hostname.toLowerCase();
        if (
          host.includes('lyhu.com.vn') || 
          host.includes('lyhu-b2b-platform.vercel.app') || 
          host.includes('localhost') ||
          host.includes('accounts.google.com')
        ) {
          updates.referrer = null;
          updatedReferrers++;
        } else {
            const newRef = refUrl.origin;
            if (newRef !== view.referrer) {
                updates.referrer = newRef;
                updatedReferrers++;
            }
        }
      } catch (e) {
        updates.referrer = null;
        updatedReferrers++;
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('website_page_views').update(updates).eq('id', view.id);
    }
  }

  console.log(`Finished. Updated ${updatedBots} bots and ${updatedReferrers} referrers.`);
}

run();
