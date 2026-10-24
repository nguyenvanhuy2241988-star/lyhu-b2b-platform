import { Product } from "@/mocks/data";
import { findMasterPriceItem } from "@/lib/priceBooks";

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

        return data.map((p: any) => {
            // Tra cứu bảng giá chuẩn Tháng 10.2026 (NPP & Siêu thị)
            const matched = findMasterPriceItem(p.sku, p.name);

            // Đơn giá bán sỉ / NPP (+8% VAT)
            const wholesalePrice = matched
                ? matched.nppPrice
                : (p.cost_price && p.cost_price > 0 ? Number(p.cost_price) : Number(p.price || 0));

            // Đơn giá siêu thị (+8% VAT)
            const supermarketPrice = matched
                ? matched.supermarketPrice
                : Number(p.price || 0);

            // Đơn giá bán lẻ niêm yết
            const retailPrice = Number(p.price || 0);

            // Đơn giá theo thùng (+8% VAT)
            const boxPrice = matched ? matched.boxPrice : 0;

            const unit = matched?.unit || p.unit || "Gói";
            const packaging = matched?.packaging || p.packaging || "";
            const category = matched?.category || p.description || "";
            const weight = matched?.weight || p.weight || "";
            const origin = matched?.origin || p.origin || "";
            const brand = p.brand || (matched?.category?.includes("CVT") ? "CVT" : matched?.category?.includes("UHi") ? "UHi" : "LHU");

            return {
                ...p,
                id: p.id,
                sku: p.sku || "",
                name: p.name,
                price: retailPrice,
                brand,
                unit,
                packaging,
                category,
                weight,
                origin,

                // 2 Bảng giá cốt lõi: Giá Sỉ (NPP) & Giá Siêu Thị tháng 10.2026
                wholesalePrice,
                supermarketPrice,
                retailPrice,
                boxPrice,

                basePrice: wholesalePrice,
                customerPrice: retailPrice,
                ctvSelfShipPrice: wholesalePrice,
                basePricePerUnit: wholesalePrice,
                ctvCommissionRate: 0.1,
                customerPriceTiers: [],
                ctvSelfShipPriceTiers: []
            } as Product;
        });
    } catch (e) {
        console.error("Error loading products exception:", e);
        return [];
    }
};
