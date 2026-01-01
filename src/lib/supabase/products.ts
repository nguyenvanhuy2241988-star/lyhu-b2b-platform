import { Product } from "@/mocks/data";

// Helper headers
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`
});

export const loadProducts = async (token?: string): Promise<Product[]> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&is_active=eq.true`, { headers });

        if (!res.ok) {
            console.error("Error loading products:", res.statusText);
            return [];
        }

        const data = await res.json();



        // Map DB fields to Frontend Product type if necessary
        // Assuming DB has snake_case and Frontend used camelCase or specific logic.
        // For now, let's assume direct mapping or simple transformation.
        // NOTE: The mock Product type has complex fields like tiered pricing.
        // If the DB schema is simple (per schema.sql), we might need to hardcode or adjust the mapping.
        // Schema.sql only defined: id, name, sku, price, is_active. 
        // BUT the app relies on tiered pricing etc. 
        // COMPLEXITY WARNING: The user instructions for Schema were minimal: "tables: profiles, products..."
        // They didn't specify all the tiered columns. 
        // STRATEGY: Fetch basic info from DB, and for now, perhaps mock the tiers OR 
        // update schema to support JSONB for tiers. 
        // PROPOSAL: I'll stick to the requested schema.sql but fill the missing complex fields with defaults 
        // so the frontend doesn't crash.

        return data.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            price: p.price,
            // Filling missing fields required by Product interface using safe defaults or deprecated logic
            brand: "LHU",
            unit: "Cai",
            wholesalePrice: p.price,
            basePrice: p.price,
            customerPrice: p.price * 1.2,
            ctvSelfShipPrice: p.price,
            basePricePerUnit: p.price,
            ctvCommissionRate: 0.1,
            customerPriceTiers: [], // No tiers in basic DB
            ctvSelfShipPriceTiers: [],

            ...p // Spread any extra matches
        })) as Product[];
    } catch (e) {
        console.error("Error loading products exception:", e);
        return [];
    }
};
