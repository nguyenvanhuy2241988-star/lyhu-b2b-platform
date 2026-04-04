require('dotenv').config({path: '.env.local'});
fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/get_orders_v3', {
    method: 'POST',
    headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({p_limit: 1})
}).then(r => r.json()).then(d => {
    console.log(JSON.stringify(d[0].items[0], null, 2));
}).catch(console.error);
