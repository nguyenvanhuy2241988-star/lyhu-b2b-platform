/**
 * Lead Distribution Service
 * Auto-assigns Messenger phone leads to online telesales staff
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MarketingLead {
    id: string;
    conversation_id: string | null;
    customer_name: string;
    customer_phone: string;
    customer_avatar: string | null;
    region: string | null;
    source: string;
    page_name: string | null;
    page_id: string | null;
    ad_id: string | null;
    first_message: string | null;
    assigned_to: string | null;
    assigned_at: string | null;
    status: 'pending' | 'assigned' | 'rejected';
    created_at: string;
}

interface LeadCreateData {
    conversationId: string;
    customerName: string;
    customerPhone: string;
    customerAvatar?: string | null;
    region?: string | null;
    source?: string;
    pageName?: string | null;
    pageId?: string | null;
    adId?: string | null;
    firstMessage?: string | null;
}

/**
 * Create a marketing lead and attempt to assign to a telesales
 * Called from webhook when phone number is detected
 */
export async function createAndAssignLead(data: LeadCreateData): Promise<{
    leadId: string | null;
    assignedTo: string | null;
    assignedName: string | null;
}> {
    try {
        // 1. Check for duplicate (same conversation already has a lead)
        if (data.conversationId) {
            const { data: existing } = await supabase
                .from('marketing_leads')
                .select('id, assigned_to')
                .eq('conversation_id', data.conversationId)
                .single();

            if (existing) {
                console.log(`[LeadDist] Lead already exists for conversation ${data.conversationId}`);
                return { leadId: existing.id, assignedTo: existing.assigned_to, assignedName: null };
            }
        }

        // 2. Insert the marketing lead
        const { data: lead, error: insertError } = await supabase
            .from('marketing_leads')
            .insert({
                conversation_id: data.conversationId,
                customer_name: data.customerName,
                customer_phone: data.customerPhone,
                customer_avatar: data.customerAvatar,
                region: data.region,
                source: data.source || 'facebook_messenger',
                page_name: data.pageName,
                page_id: data.pageId,
                ad_id: data.adId,
                first_message: data.firstMessage,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            // Unique constraint violation = duplicate
            if (insertError.code === '23505') {
                console.log(`[LeadDist] Duplicate lead for conversation ${data.conversationId}`);
                return { leadId: null, assignedTo: null, assignedName: null };
            }
            console.error('[LeadDist] Insert error:', insertError);
            return { leadId: null, assignedTo: null, assignedName: null };
        }

        console.log(`[LeadDist] Created marketing lead ${lead.id} for ${data.customerName} (${data.customerPhone})`);

        // 3. Try to assign to an online telesales
        const result = await assignLeadToTelesales(lead.id);
        return {
            leadId: lead.id,
            assignedTo: result.assignedTo,
            assignedName: result.assignedName
        };

    } catch (error) {
        console.error('[LeadDist] Error:', error);
        return { leadId: null, assignedTo: null, assignedName: null };
    }
}

/**
 * Assign a pending marketing lead to a random online telesales
 */
export async function assignLeadToTelesales(marketingLeadId: string): Promise<{
    assignedTo: string | null;
    assignedName: string | null;
}> {
    try {
        // Get online eligible telesales (random order)
        const { data: eligibleUsers, error: rpcError } = await supabase
            .rpc('get_online_eligible_telesales');

        if (rpcError) {
            console.error('[LeadDist] RPC error:', rpcError);
            return { assignedTo: null, assignedName: null };
        }

        if (!eligibleUsers || eligibleUsers.length === 0) {
            console.log('[LeadDist] No eligible telesales online — lead stays pending');
            return { assignedTo: null, assignedName: null };
        }

        // Pick the first one (already randomized by SQL)
        const chosen = eligibleUsers[0];

        // Get the lead data for creating CRM record
        const { data: lead } = await supabase
            .from('marketing_leads')
            .select('*')
            .eq('id', marketingLeadId)
            .single();

        if (!lead) return { assignedTo: null, assignedName: null };

        // Update marketing lead
        await supabase
            .from('marketing_leads')
            .update({
                assigned_to: chosen.user_id,
                assigned_at: new Date().toISOString(),
                status: 'assigned',
                updated_at: new Date().toISOString()
            })
            .eq('id', marketingLeadId);

        // Create CRM lead for this telesales
        const regionText = lead.region || 'Chưa rõ';
        const { error: crmError } = await supabase
            .from('crm_leads')
            .insert({
                user_id: chosen.user_id,
                assigned_to: chosen.user_id,
                title: `[FB] ${lead.customer_name} - ${regionText}`,
                customer_name: lead.customer_name,
                phone: lead.customer_phone,
                stage: 'new_data',
                priority: 'normal',
                note: [
                    `📱 SĐT: ${lead.customer_phone}`,
                    `📍 Khu vực: ${regionText}`,
                    `📄 Nguồn: ${lead.page_name || 'Facebook Messenger'}`,
                    lead.ad_id ? `📢 Quảng cáo: ${lead.ad_id}` : null,
                    lead.first_message ? `💬 Tin nhắn: ${lead.first_message}` : null,
                ].filter(Boolean).join('\n'),
                order: 0
            });

        if (crmError) {
            console.error('[LeadDist] CRM create error:', crmError);
        } else {
            console.log(`[LeadDist] ✅ Assigned to ${chosen.full_name} (${chosen.user_id})`);
        }

        return { assignedTo: chosen.user_id, assignedName: chosen.full_name };

    } catch (error) {
        console.error('[LeadDist] Assignment error:', error);
        return { assignedTo: null, assignedName: null };
    }
}

/**
 * Process all pending (unassigned) leads
 * Called by cron job or when telesales comes online
 */
export async function processQueuedLeads(): Promise<number> {
    try {
        // Get all pending leads
        const { data: pendingLeads, error } = await supabase
            .from('marketing_leads')
            .select('id')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error || !pendingLeads || pendingLeads.length === 0) {
            return 0;
        }

        console.log(`[LeadDist] Processing ${pendingLeads.length} pending leads...`);

        let assigned = 0;
        for (const lead of pendingLeads) {
            const result = await assignLeadToTelesales(lead.id);
            if (result.assignedTo) {
                assigned++;
            } else {
                // No more online telesales, stop trying
                break;
            }
        }

        console.log(`[LeadDist] Assigned ${assigned}/${pendingLeads.length} pending leads`);
        return assigned;

    } catch (error) {
        console.error('[LeadDist] Queue processing error:', error);
        return 0;
    }
}
