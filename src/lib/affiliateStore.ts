import { supabase } from "@/lib/supabaseClient";

export interface AffiliateProfile {
    id: string;
    user_id: string;
    affiliate_code: string;
    commission_rate: number;
    status: string;
    created_at: string;
    updated_at: string;
    bank_name?: string;
    bank_account_name?: string;
    bank_account_number?: string;
    total_withdrawn?: number;
}

export interface AffiliateWithdrawal {
    id: string;
    affiliate_id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    bank_info: {
        bank_name: string;
        bank_account_name: string;
        bank_account_number: string;
    };
    note?: string;
    created_at: string;
    updated_at: string;
    affiliate_profiles?: {
        users: {
            name: string;
            email: string;
            phone: string;
        };
        affiliate_code: string;
    };
}

export async function updatePaymentInfo(affiliateId: string, bankDetails: { bank_name: string; bank_account_name: string; bank_account_number: string }) {
    const { error } = await supabase
        .from('affiliate_profiles')
        .update(bankDetails)
        .eq('id', affiliateId);
    
    if (error) {
        console.error("Error updating payment info:", error);
        return false;
    }
    return true;
}

export async function requestWithdrawal(affiliateId: string, amount: number, bankInfo: any) {
    const { error } = await supabase
        .from('affiliate_withdrawals')
        .insert({
            affiliate_id: affiliateId,
            amount: amount,
            bank_info: bankInfo,
            status: 'pending'
        });
    
    if (error) {
        console.error("Error requesting withdrawal:", error);
        return false;
    }
    return true;
}

export async function getWithdrawalHistory(affiliateId: string) {
    const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Error fetching withdrawal history:", error);
        return [];
    }
    return data as AffiliateWithdrawal[];
}

export async function getAllWithdrawals(token?: string) {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .select(`
            *,
            affiliate_profiles (
                affiliate_code,
                profiles:user_id ( full_name, email, phone )
            )
        `)
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Error fetching all withdrawals:", error);
        return [];
    }
    return data;
}

export async function updateWithdrawalStatus(withdrawalId: string, status: 'approved' | 'rejected', note?: string, amount?: number, affiliateId?: string) {
    // If approved, we should also increment total_withdrawn in affiliate_profiles
    if (status === 'approved' && amount && affiliateId) {
        // Since Supabase JS doesn't have an easy increment, we should probably fetch the current or rely on an RPC.
        // For simplicity, we can fetch current profile and add.
        const { data: profile } = await supabase.from('affiliate_profiles').select('total_withdrawn').eq('id', affiliateId).single();
        const currentWithdrawn = profile?.total_withdrawn || 0;
        
        await supabase.from('affiliate_profiles').update({
            total_withdrawn: currentWithdrawn + amount
        }).eq('id', affiliateId);
    }

    const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
            status: status,
            note: note,
            updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);
        
    if (error) {
        console.error("Error updating withdrawal status:", error);
        return false;
    }
    return true;
}

export async function getAffiliateDailyReport(date: string, userId: string) {
    const { data, error } = await supabase
        .from('affiliate_daily_activities')
        .select('*')
        .eq('date', date)
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching affiliate daily report:", error);
    }
    return data;
}

export async function updateAffiliateDailyReport(report: any) {
    const { data, error } = await supabase
        .from('affiliate_daily_activities')
        .update({
            issues: report.issues,
            request_support: report.request_support,
            plan_next_day: report.plan_next_day,
            other_tasks: report.other_tasks,
            candidate_feedback: report.candidate_feedback,
            no_post_reason: report.no_post_reason
        })
        .eq('id', report.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getMyAffiliateReportsHistory(userId: string) {
    const { data, error } = await supabase
        .from('affiliate_daily_activities')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);

    if (error) {
        console.error("Error fetching affiliate report history:", error);
        return [];
    }
    return data;
}

export async function getAffiliatePostLogs(userId: string, date: string) {
    const { data, error } = await supabase
        .from('affiliate_post_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching affiliate post logs:", error);
        return [];
    }
    return data;
}

export async function upsertAffiliatePostLog(log: any) {
    const { data, error } = await supabase
        .from('affiliate_post_logs')
        .upsert(log)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteAffiliatePostLog(id: string) {
    const { error } = await supabase
        .from('affiliate_post_logs')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}
