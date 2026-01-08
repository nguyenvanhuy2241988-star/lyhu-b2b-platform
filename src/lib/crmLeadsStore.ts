'use client';

import { supabase } from './supabaseClient';

export const LEADS_TABLE = 'crm_leads' as const;

export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent';

// 11 CRM stages
export type LeadStage = 'new_data' | 'npp' | 'supermarket' | 'waiting' | 'meeting' | 'contract' | 'cskh' | 'order' | 'issues' | 'debt' | 'done';

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
    new_data: 'Data mới nhận chưa phân loại',
    npp: 'Chào hàng NPP',
    supermarket: 'Chào hàng siêu thị',
    waiting: 'Đợi khách phản hồi',
    meeting: 'Gặp mặt trực tiếp',
    contract: 'Lên hợp đồng',
    cskh: 'CSKH / Nhắc nhập hàng',
    order: 'Lên đơn',
    issues: 'Xử lý vấn đề',
    debt: 'Thu hồi công nợ',
    done: 'Hoàn tất',
};

export const LEAD_PRIORITY_LABELS: Record<string, string> = {
    low: 'Thấp',
    normal: 'Bình thường',
    high: 'Cao',
    urgent: 'Khẩn',
};

export type CRMColumn = {
    id: string;
    label: string;
    stage: LeadStage;
    order: number;
    isDefault?: boolean;
    isVisible?: boolean;
};

export const DEFAULT_CRM_COLUMNS: CRMColumn[] = [
    { id: 'new_data', label: 'Data mới nhận chưa phân loại', stage: 'new_data', order: 0, isDefault: true, isVisible: true },
    { id: 'npp', label: 'Chào hàng NPP', stage: 'npp', order: 1, isDefault: true, isVisible: true },
    { id: 'supermarket', label: 'Chào hàng siêu thị', stage: 'supermarket', order: 2, isDefault: true, isVisible: true },
    { id: 'waiting', label: 'Đợi khách phản hồi', stage: 'waiting', order: 3, isDefault: true, isVisible: true },
    { id: 'meeting', label: 'Gặp mặt trực tiếp', stage: 'meeting', order: 4, isDefault: true, isVisible: true },
    { id: 'contract', label: 'Lên hợp đồng', stage: 'contract', order: 5, isDefault: true, isVisible: true },
    { id: 'cskh', label: 'CSKH / Nhắc nhập hàng', stage: 'cskh', order: 6, isDefault: true, isVisible: true },
    { id: 'order', label: 'Lên đơn', stage: 'order', order: 7, isDefault: true, isVisible: true },
    { id: 'issues', label: 'Xử lý vấn đề', stage: 'issues', order: 8, isDefault: true, isVisible: true },
    { id: 'debt', label: 'Thu hồi công nợ', stage: 'debt', order: 9, isDefault: true, isVisible: true },
    { id: 'done', label: 'Hoàn tất', stage: 'done', order: 10, isDefault: true, isVisible: true },
];

const CRM_COLUMNS_KEY = 'lyhu:crm:columns:v1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY || '',
    'Authorization': `Bearer ${token || SUPABASE_KEY}`
});

export function loadCRMColumns(): CRMColumn[] {
    if (typeof window === 'undefined') return DEFAULT_CRM_COLUMNS;
    try {
        const raw = localStorage.getItem(CRM_COLUMNS_KEY);
        if (!raw) return DEFAULT_CRM_COLUMNS;

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CRM_COLUMNS;

        const cleaned = parsed
            .filter((c: any) => c && typeof c.id === 'string')
            .map((c: any) => ({
                id: String(c.id),
                label: (typeof c.label === 'string' && c.label.trim()) ? c.label : (c.title || String(c.id)),
                stage: (c.stage as LeadStage) || (c.id as LeadStage),
                order: typeof c.order === 'number' ? c.order : 0,
                isDefault: !!c.isDefault,
                isVisible: c.isVisible !== false
            }));

        return cleaned.length > 0 ? cleaned : DEFAULT_CRM_COLUMNS;
    } catch {
        return DEFAULT_CRM_COLUMNS;
    }
}

export function saveCRMColumns(cols: CRMColumn[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CRM_COLUMNS_KEY, JSON.stringify(cols ?? DEFAULT_CRM_COLUMNS));
        window.dispatchEvent(new Event("crm-leads-columns-updated"));
    } catch { }
}

export async function fetchCRMColumnsFromDB(token?: string): Promise<CRMColumn[] | null> {
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;

    try {
        const headers = getHeaders(token);
        // Reuse the same app_settings table, focusing on 'crm_columns' 
        // NOTE: If Leads needs SEPARATE columns, we should add 'leads_columns' to DB.
        // Assuming for now we want to share OR user meant CRM Deals context.
        // If this file is for LEADS, maybe it should use a different key?
        // Checking user request: "Sync CRM Columns" usually implies the main Deals Board.
        // But to be safe, if this is "Leads Store", we might want to keep using local or separate config.
        // HOWEVER, user said "CRM ở admin" -> referring to Deals usually.
        // I will implement pulling 'crm_columns' here BUT mapped to LeadStage if compatible,
        // OR simply enable the mechanism. 
        // Given Leads stages are DIFFERENT from Deal Stages (check types), shared config might break.
        // Leads: new_data, npp, supermarket...
        // Deals: new_data, npp, supermarket...
        // They look IDENTICAL in the files I read!

        const res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?select=crm_columns&limit=1`, { headers });
        if (!res.ok) throw new Error('Failed to fetch settings');

        const data = await res.json();
        if (data && data.length > 0 && data[0].crm_columns) {
            const cols = data[0].crm_columns;
            saveCRMColumns(cols);
            return cols;
        }
    } catch (err) {
        console.error('fetchCRMColumnsFromDB (Leads) error:', err);
    }
    return loadCRMColumns();
}

export async function saveCRMColumnsToDB(cols: CRMColumn[], token?: string): Promise<boolean> {
    // 1. Save local
    saveCRMColumns(cols);

    try {
        console.log('[CRM Debug] Saving leads columns via RPC...', { count: cols.length });

        // Use the same shared RPC
        const { error } = await supabase.rpc('update_crm_columns', {
            new_columns: cols
        });

        if (error) {
            console.error('[CRM Debug] RPC Error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('saveCRMColumnsToDB (Leads) error:', err);
        return false;
    }
}

export type CRMLead = {
    id: string;
    user_id: string;
    title: string;
    customer_name?: string | null;
    phone?: string | null;
    company?: string | null;
    note?: string | null;
    stage: LeadStage;
    priority: LeadPriority;
    due_date?: string | null;
    assigned_to?: string | null;
    order?: number | null;
    created_at: string;
    updated_at: string;
};

// Fetch leads
export async function fetchLeads(userId?: string): Promise<CRMLead[]> {
    if (!userId) {
        console.warn('fetchLeads: no userId provided');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from(LEADS_TABLE)
            .select('*')
            .eq('assigned_to', userId)
            .order('order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('fetchLeads error:', error);
            return [];
        }

        return (data || []) as CRMLead[];
    } catch (err) {
        console.error('fetchLeads exception:', err);
        return [];
    }
}

// Create lead
export async function createLead(lead: Partial<CRMLead>): Promise<CRMLead | null> {
    // Ensure user_id is set from assigned_to for RLS policies
    const leadData = {
        ...lead,
        user_id: lead.assigned_to || lead.user_id,
    };

    const { data, error } = await supabase
        .from(LEADS_TABLE)
        .insert([leadData])
        .select()
        .single();

    if (error) {
        console.error('createLead error:', error);
        return null;
    }

    return data as CRMLead;
}


// Update lead
export async function updateLead(id: string, updates: Partial<CRMLead>): Promise<boolean> {
    // Sync user_id with assigned_to if assigned_to is being updated
    const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
    };

    if (updates.assigned_to) {
        updateData.user_id = updates.assigned_to;
    }

    const { error } = await supabase
        .from(LEADS_TABLE)
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('updateLead error:', error);
        return false;
    }

    return true;
}


// Delete lead
export async function deleteLead(id: string): Promise<boolean> {
    const { error } = await supabase
        .from(LEADS_TABLE)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteLead error:', error);
        return false;
    }

    return true;
}

// Move lead (update stage and order)
export async function moveLead(id: string, newStage: LeadStage, newOrder?: number): Promise<boolean> {
    const updates: Partial<CRMLead> = { stage: newStage };
    if (newOrder !== undefined) updates.order = newOrder;

    return updateLead(id, updates);
}
