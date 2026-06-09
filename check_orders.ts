import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
const env = await load({ envPath: ".env.local" });
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const res = await fetch(`${url}/rest/v1/rpc/get_orders_v3`, {
  method: 'POST',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ p_id: "ORD-435" })
});
console.log(JSON.stringify(await res.json(), null, 2));
