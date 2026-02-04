import { supabase } from "@/lib/supabaseClient";

interface MisaConfig {
    clientId: string;
    clientSecret: string;
    companyCode: string;
    accessToken?: string;
    tokenExpiry?: string;
}

// Temporary in-memory cache for token (should be DB in production)
let tokenCache: { token: string; expiresAt: number } | null = null;

export const MisaService = {
    // 1. Authentication
    getAccessToken: async (): Promise<string | null> => {
        // Mock implementation for development phase
        // In real impl, fetch from app_settings, check expiry, call Misa Auth API
        console.log("[MisaService] Getting access token...");
        return "mock_misa_access_token_" + Date.now();
    },

    // 2. Map Order to Misa Invoice
    mapOrderToMisaInvoice: (order: any) => {
        return {
            refId: order.id,
            refNo: `ORD-${order.readableId}`,
            refDate: order.createdAt,
            accountObjectCode: order.customer?.misa_code || "KH_LE", // Fallback to generic customer
            journalMemo: `Bán hàng cho đơn hàng #${order.readableId}`,
            totalAmount: order.totalAmount,
            details: (order.items || []).map((item: any) => ({
                inventoryItemCode: item.product?.misa_code || item.sku || "SP_KHAC",
                description: item.name,
                quantity: item.quantity,
                unitPrice: item.price || item.unitPrice,
                amount: item.subtotal || ((item.price || item.unitPrice) * item.quantity),
                vatRate: order.vat || 0
            }))
        };
    },

    // 3. Push to Misa
    pushSalesOrder: async (orderId: string, orderData: any): Promise<{ success: boolean; refId?: string; error?: string }> => {
        try {
            console.log(`[MisaService] Pushing order ${orderId} to Misa...`);

            const token = await MisaService.getAccessToken();
            if (!token) return { success: false, error: "Failed to authenticate with Misa" };

            const payload = MisaService.mapOrderToMisaInvoice(orderData);
            console.log("[MisaService] Payload:", JSON.stringify(payload, null, 2));

            // --- REAL MOCK ---
            // Simulate network delay
            await new Promise(r => setTimeout(r, 1500));

            // Simulate success
            const mockMisaRefId = "MISA-SA-" + Date.now();
            console.log(`[MisaService] Success! Misa Ref ID: ${mockMisaRefId}`);

            return { success: true, refId: mockMisaRefId };
            // ------------------

            /* Real Implementation would look like this:
            const res = await fetch("https://actapp.misa.vn/api/v1/fa/sa_invoice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.text();
                return { success: false, error: err };
            }
            const data = await res.json();
            return { success: true, refId: data.refID };
            */

        } catch (err: any) {
            console.error("[MisaService] Exception:", err);
            return { success: false, error: err.message };
        }
    }
};
