const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.replace('\r', '').match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/"/g, '');
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

fetch(`${url}/rest/v1/customers?select=*&name=ilike.*địa chỉ cũ*`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(res => res.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).catch(console.error);
