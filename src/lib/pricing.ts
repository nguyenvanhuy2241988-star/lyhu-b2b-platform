import { Product } from "@/mocks/data";

export function getTierPrice(
    tiers: { minQty: number; maxQty?: number; pricePerUnit: number }[],
    quantity: number
): number {
    if (!tiers || tiers.length === 0) return 0;

    const match = tiers.find((tier) => {
        if (tier.maxQty == null) return quantity >= tier.minQty;
        return quantity >= tier.minQty && quantity <= tier.maxQty;
    });

    // fallback: if no match found (e.g. quantity < minQty of first tier), return first tier price
    // or if quantity is higher than all defined ranges (though last tier usually has no maxQty)
    return match ? match.pricePerUnit : tiers[0]?.pricePerUnit ?? 0;
}

export function getCustomerUnitPrice(product: Product, quantity: number) {
    if (!product.customerPriceTiers || product.customerPriceTiers.length === 0) {
        return product.customerPrice || 0; // Fallback to legacy price
    }
    return getTierPrice(product.customerPriceTiers, quantity);
}

export function getCtvSelfShipUnitPrice(product: Product, quantity: number) {
    if (!product.ctvSelfShipPriceTiers || product.ctvSelfShipPriceTiers.length === 0) {
        return product.ctvSelfShipPrice || 0; // Fallback to legacy price
    }
    return getTierPrice(product.ctvSelfShipPriceTiers, quantity);
}
