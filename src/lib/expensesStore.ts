import { createClient } from './supabaseClient';

const supabase = createClient();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Prefer': 'return=representation'
});

export type ExpenseCategory =
    | 'office_rent'
    | 'electricity_water'
    | 'marketing'
    | 'salary'
    | 'bonus'
    | 'inventory'
    | 'other';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    office_rent: 'Thuê văn phòng / kho',
    electricity_water: 'Điện & Nước',
    marketing: 'Marketing / Quảng cáo',
    salary: 'Lương nhân viên',
    bonus: 'Thưởng / Hoa hồng',
    inventory: 'Nhập hàng',
    other: 'Chi phí khác'
};

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: ExpenseCategory;
    spent_at: string;
    created_at: string;
    created_by: string;
    misa_sync_status?: 'pending' | 'synced';
    misa_sync_at?: string;
    accounting_account?: string; // e.g., '641', '642'
    accounting_object?: string;  // e.g., 'NCC_A', 'NV_B'
    invoice_url?: string;
}

export async function fetchExpenses(token?: string, filters?: { category?: string, startDate?: string, endDate?: string }): Promise<Expense[]> {
    try {
        const headers = getHeaders(token);
        let query = `select=*&order=spent_at.desc`;

        if (filters?.category) query += `&category=eq.${filters.category}`;
        if (filters?.startDate) query += `&spent_at=gte.${filters.startDate}`;
        if (filters?.endDate) query += `&spent_at=lte.${filters.endDate}`;

        const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?${query}`, { headers });
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('fetchExpenses error:', err);
        return [];
    }
}

export async function createExpense(expense: Partial<Expense>, token?: string): Promise<Expense | null> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses`, {
            method: 'POST',
            headers,
            body: JSON.stringify(expense)
        });
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data) ? data[0] : data;
    } catch (err) {
        console.error('createExpense error:', err);
        return null;
    }
}

export async function updateExpense(id: string, updates: Partial<Expense>, token?: string): Promise<boolean> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updates)
        });
        return res.ok;
    } catch (err) {
        console.error('updateExpense error:', err);
        return false;
    }
}

export async function markExpensesAsSynced(ids: string[], token?: string): Promise<boolean> {
    try {
        const headers = getHeaders(token);
        const promises = ids.map(id =>
            fetch(`${SUPABASE_URL}/rest/v1/expenses?id=eq.${id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    misa_sync_status: 'synced',
                    misa_sync_at: new Date().toISOString()
                })
            })
        );
        const results = await Promise.all(promises);
        return results.every(r => r.ok);
    } catch (err) {
        console.error('markExpensesAsSynced error:', err);
        return false;
    }
}

export async function deleteExpense(id: string, token?: string): Promise<boolean> {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?id=eq.${id}`, {
            method: 'DELETE',
            headers
        });
        return res.ok;
    } catch (err) {
        console.error('deleteExpense error:', err);
        return false;
    }
}
