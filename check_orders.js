const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.replace('\r', '').match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/"/g, '');
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

fetch(`${url}/rest/v1/rpc/get_orders_v3`, {
  method: 'POST',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
}).then(res => res.json()).then(data => {
  if (Array.isArray(data) && data.length > 0) {
     console.log("Readable IDs sample:", data.slice(0, 5).map(o => o.readable_id));
     const order = data.find(o => String(o.readable_id).includes('435'));
     console.log(JSON.stringify(order, null, 2));
  } else {
     console.log("No data returned or error:", data);
  }
}).catch(console.error);
