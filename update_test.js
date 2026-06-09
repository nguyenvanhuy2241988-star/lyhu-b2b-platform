const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.replace('\r', '').match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/"/g, '');
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Update customer
fetch(`${url}/rest/v1/customers?name=ilike.*test địa chỉ cũ*`, {
  method: 'PATCH',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ old_address: "Bình Thạnh, Hồ Chí Minh" })
}).then(() => {
  // Update order
  fetch(`${url}/rest/v1/orders?readable_id=eq.435`, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ receiver_address: "Bình Thạnh, Hồ Chí Minh" })
  }).then(console.log).catch(console.error);
}).catch(console.error);
