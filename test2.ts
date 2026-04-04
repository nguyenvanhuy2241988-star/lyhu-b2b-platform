import { fetchOrders } from './src/lib/ordersStore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    console.log("Fetching orders...");
    const orders = await fetchOrders(undefined);
    console.log(JSON.stringify(orders[0]?.items?.[0], null, 2));
}

run().catch(console.error);
