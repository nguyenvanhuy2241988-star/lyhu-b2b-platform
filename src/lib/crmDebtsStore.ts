import { createClient } from "./supabaseClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Prefer': 'return=representation'
});

export interface CustomerDebt {
    id: string; // customerId
    customerName: string;
    totalDebt: number;
    overdueDebt: number;
    creditLimit: number;
    lastPaymentAt?: string;
    paymentTermDays: number;
}

export const fetchAllDebts = async (token?: string): Promise<CustomerDebt[]> => {
    try {
        const headers = getHeaders(token);

        // Fetch all orders with stats
        // In a real app, this would be a specialized SQL view or RPC
        const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=customer_id,customer_name,total_amount,status,created_at&status=eq.delivered`, { headers });
        if (!res.ok) return [];
        const orders = await res.json();

        const debtsMap: Record<string, CustomerDebt> = {};

        orders.forEach((o: any) => {
            if (!debtsMap[o.customer_id]) {
                debtsMap[o.customer_id] = {
                    id: o.customer_id,
                    customerName: o.customer_name,
                    totalDebt: 0,
                    overdueDebt: 0,
                    creditLimit: 50000000, // Default 50M
                    paymentTermDays: 30     // Default 30 days
                };
            }
            debtsMap[o.customer_id].totalDebt += o.total_amount;

            // Check overdue (simplified logic)
            const dueDate = new Date(o.created_at);
            dueDate.setDate(dueDate.getDate() + 30);
            if (new Date() > dueDate) {
                debtsMap[o.customer_id].overdueDebt += o.total_amount;
            }
        });

        return Object.values(debtsMap);
    } catch {
        return [];
    }
};
