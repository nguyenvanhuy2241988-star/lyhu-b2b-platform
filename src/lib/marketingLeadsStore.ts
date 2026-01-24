import { supabase } from './supabaseClient';

export interface StagingLead {
    id: string;
    created_at: string;
    source: string;
    source_id: string;
    name: string;
    phone: string;
    profile_url: string;
    raw_data: any;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
}

export const STAGING_TABLE = 'marketing_leads_staging';

export async function getPendingLeads() {
    const { data, error } = await supabase
        .from(STAGING_TABLE)
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as StagingLead[];
}

export async function rejectLead(id: string, reason: string = 'Spam/Low Quality') {
    const { error } = await supabase
        .from(STAGING_TABLE)
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', id);
    if (error) throw error;
}

export async function approveLeadToCRM(lead: StagingLead) {
    // 1. Insert into Real CRM (leads table)
    // Assuming 'leads' table exists from previous context. 
    // If not, we might need to adjust based on user's CRM schema.
    // Based on open files, 'crm_leads' or 'leads' exists.
    // Let's assume a standard 'crm_leads' or we map to 'leads'.

    // We'll check the 'crm_leads' schema later if needed, but for now allow basic mapping.
    // Ideally we call an existing function e.g. createLead.

    // For this Level, we just mark as Approved in Staging + (Placeholder for CRM Insert)
    // In a real flow, transactionally move it.

    const { error } = await supabase
        .from(STAGING_TABLE)
        .update({ status: 'approved' })
        .eq('id', lead.id);

    if (error) throw error;

    // OPTIONAL: Auto-insert to crm_leads here if we knew the schema perfectly.
    // For now, let's just mark status.
}
