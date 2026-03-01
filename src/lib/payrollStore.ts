import { createClient } from "./supabaseClient";

const supabase = createClient();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    'Prefer': 'return=representation'
});

export type TransactionType = 'bonus' | 'penalty' | 'commission' | 'base_salary';
export type TransactionStatus = 'estimated' | 'finalized';

export interface FinancialTransaction {
    id: string;
    userId: string;
    type: TransactionType;
    category: string;
    amount: number;
    status: TransactionStatus;
    referenceId?: string;
    note?: string;
    createdAt: string;
    metadata?: any;
}

export interface PayrollConfig {
    role: string;
    label: string;
    baseSalaryMonthly: number;
    bonusNewSupermarket: number;
    bonusNewAgency: number;
    bonusNewDistributor: number;
    commissionRate: number; // Phase 3: Dynamic commission
}

export interface PayrollLock {
    year: number;
    month: number;
    lockedAt: string;
    lockedBy?: string;
}

export const fetchPayrollConfig = async (role: string, token?: string): Promise<PayrollConfig | null> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/payroll_configs?role=eq.${role}&limit=1`, { headers, cache: 'no-store' });

        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.length === 0) return null;

        const config = data[0];
        return {
            role: config.role,
            label: config.label,
            baseSalaryMonthly: config.base_salary_monthly,
            bonusNewSupermarket: config.bonus_new_supermarket,
            bonusNewAgency: config.bonus_new_agency,
            bonusNewDistributor: config.bonus_new_distributor,
            commissionRate: config.commission_rate || 0.03 // Phase 3
        };
    } catch {
        return null;
    }
};

export const fetchPayrollLocks = async (year: number, token?: string): Promise<PayrollLock[]> => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/payroll_locks?year=eq.${year}`, { headers, cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((l: any) => ({
            year: l.year,
            month: l.month,
            lockedAt: l.locked_at,
            lockedBy: l.locked_by
        }));
    } catch {
        return [];
    }
};

export const setPayrollLock = async (year: number, month: number, userId: string, token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/payroll_locks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ year, month, locked_by: userId }),
            cache: 'no-store'
        });
        return res.ok;
    } catch {
        return false;
    }
};

export const fetchUserTransactions = async (userId: string, token?: string, options?: { startDate?: string; endDate?: string }): Promise<FinancialTransaction[]> => {
    try {
        const headers = getHeaders(token);
        let url = `${SUPABASE_URL}/rest/v1/financial_transactions?user_id=eq.${userId}&order=created_at.desc`;

        // Add date range filtering if provided
        if (options?.startDate) {
            url += `&created_at=gte.${options.startDate}`;
        }
        if (options?.endDate) {
            url += `&created_at=lte.${options.endDate}`;
        }

        const res = await fetch(url, { headers, cache: 'no-store' });

        if (!res.ok) return [];
        const data = await res.json();

        return data.map((t: any) => ({
            id: t.id,
            userId: t.user_id,
            type: t.type,
            category: t.category,
            amount: t.amount,
            status: t.status,
            referenceId: t.reference_id,
            note: t.note,
            createdAt: t.created_at,
            metadata: t.metadata
        }));
    } catch {
        return [];
    }
};

export const addFinancialTransaction = async (transaction: Partial<FinancialTransaction>, token?: string) => {
    try {
        const headers = getHeaders(token);
        const payload = {
            p_user_id: transaction.userId,
            p_type: transaction.type,
            p_category: transaction.category,
            p_amount: transaction.amount,
            p_status: transaction.status || 'estimated',
            p_reference_id: transaction.referenceId || null,
            p_note: transaction.note || null,
            p_metadata: transaction.metadata || {}
        };

        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_financial_transaction_v2`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error("RPC create_financial_transaction_v2 failed", await res.text());
            return false;
        }

        return await res.json();
    } catch {
        return false;
    }
};

export const updateTransactionStatus = async (referenceId: string, status: TransactionStatus, token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/financial_transactions?reference_id=eq.${referenceId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status })
        });
        return res.ok;
    } catch {
        return false;
    }
};
// ... (previous exports)

export const deleteFinancialTransactions = async (referenceId: string, token?: string) => {
    try {
        const headers = getHeaders(token);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/financial_transactions?reference_id=eq.${referenceId}`, {
            method: 'DELETE',
            headers
        });
        return res.ok;
    } catch {
        return false;
    }
};

// --- KPI SETTINGS ---

export interface UserKpiSettings {
    user_id: string;
    daily_calls_target: number;
    daily_orders_target: number;
    daily_revenue_target: number;
    commission_rate: number;
    base_salary_monthly: number;
    kpi_targets: Record<string, any>; // JSONB
    working_days_standard: number;
    working_days_actual: number | null;
    auto_working_days?: number;
}

export const fetchUserKpiSettings = async (userId: string, token?: string): Promise<UserKpiSettings | null> => {
    try {
        const { data, error } = await supabase.rpc('get_user_kpi_settings', { p_user_id: userId });
        if (error) {
            console.error('get_user_kpi_settings RPC error:', error);
            return null;
        }
        return data as UserKpiSettings;
    } catch (e) {
        console.error('fetchUserKpiSettings Exception:', e);
        return null;
    }
};

export const updateUserKpiSettings = async (settings: UserKpiSettings, token?: string): Promise<boolean> => {
    try {
        const { error } = await supabase.rpc('update_user_kpi_settings', {
            p_user_id: settings.user_id,
            p_daily_calls_target: settings.daily_calls_target,
            p_daily_orders_target: settings.daily_orders_target,
            p_daily_revenue_target: settings.daily_revenue_target,
            p_commission_rate: settings.commission_rate,
            p_base_salary_monthly: settings.base_salary_monthly,
            p_kpi_targets: settings.kpi_targets,
            p_working_days_standard: settings.working_days_standard || 26,
            p_working_days_actual: settings.working_days_actual
        });

        if (error) {
            console.error('update_user_kpi_settings RPC error:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('updateUserKpiSettings Exception:', e);
        return false;
    }
};
