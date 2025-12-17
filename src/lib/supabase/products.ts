import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/mocks/data";

// Using a simplified version of Product for now, or casting the Supabase response
// ideally we should define a strict DB type, but for speed we'll map to existing type.

export const loadProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error("Error loading products:", error);
        return [];
    }

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
};
