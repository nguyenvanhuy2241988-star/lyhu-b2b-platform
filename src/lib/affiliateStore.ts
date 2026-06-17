import { supabase } from "./supabaseClient";

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
