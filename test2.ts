import { fetchOrders } from './src/lib/ordersStore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    console.log("Fetching orders...");
    const orders = await fetchOrders(undefined, undefined, undefined, undefined, 1);
    console.log(JSON.stringify(orders[0].items[0], null, 2));
}

run().catch(console.error);
