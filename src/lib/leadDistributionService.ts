/**
 * Lead Distribution Service
 * Auto-assigns Messenger phone leads to online telesales staff
 */

import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
 * Assign a pending marketing lead to a telesales
 * If targetUserId is provided, assign directly to that user (for round-robin)
 * Otherwise, query eligible telesales via RPC (for real-time webhook)
 */
export async function assignLeadToTelesales(
    marketingLeadId: string,
    targetUserId?: string,
    targetUserName?: string
): Promise<{
    assignedTo: string | null;
    assignedName: string | null;
}> {
    try {
        let chosen: { user_id: string; full_name: string };

        if (targetUserId && targetUserName) {
            // Round-robin mode: use pre-selected user
            chosen = { user_id: targetUserId, full_name: targetUserName };
        } else {
            // Real-time mode: query for best eligible user (least leads first)
            const { data: eligibleUsers, error: rpcError } = await supabase
                .rpc('get_online_eligible_telesales');

            if (rpcError) {
                console.error('[LeadDist] RPC error:', rpcError);
                return { assignedTo: null, assignedName: null };
            }

            if (!eligibleUsers || eligibleUsers.length === 0) {
                console.log('[LeadDist] No eligible telesales online (or all at quota) — lead stays pending');
                return { assignedTo: null, assignedName: null };
            }

            // Pick the first one (already sorted by least leads in SQL)
            chosen = eligibleUsers[0];
        }

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

        // Create CRM customer + deal for this telesales
        const regionText = lead.region || 'Chưa rõ';

        // 1. Find or create customer by phone
        let customerId: string | null = null;
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', lead.customer_phone)
            .maybeSingle();

        if (existingCustomer) {
            customerId = existingCustomer.id;
        } else {
            const { data: newCustomer, error: custError } = await supabase
                .from('customers')
                .insert({
                    name: lead.customer_name || 'Khách FB',
                    phone: lead.customer_phone,
                    province: lead.region || null,
                    owner_user_id: chosen.user_id,
                    type: 'tap_hoa',
                    status: 'active'
                })
                .select('id')
                .single();

            if (custError) {
                console.error('[LeadDist] Customer create error:', custError);
            } else {
                customerId = newCustomer.id;
            }
        }

        // 2. Create CRM deal
        if (customerId) {
            const { error: dealError } = await supabase
                .from('crm_deals')
                .insert({
                    title: `[FB] ${lead.customer_name} - ${regionText}`,
                    customer_id: customerId,
                    stage: 'new_data',
                    priority: 'normal',
                    source: 'data_moi',
                    source_category: 'COMPANY',
                    source_detail: 'Facebook Messenger',
                    owner_user_id: chosen.user_id,
                    status: 'open',
                    is_new_customer: !existingCustomer,
                    note: [
                        `📱 SĐT: ${lead.customer_phone}`,
                        `📍 Khu vực: ${regionText}`,
                        `📄 Nguồn: ${lead.page_name || 'Facebook Messenger'}`,
                        lead.ad_id ? `📢 Quảng cáo: ${lead.ad_id}` : null,
                        lead.first_message ? `💬 Tin nhắn: ${lead.first_message}` : null,
                    ].filter(Boolean).join('\n'),
                    tags: ['facebook', 'auto-distributed']
                });

            if (dealError) {
                console.error('[LeadDist] CRM deal create error:', dealError);
            } else {
                console.log(`[LeadDist] ✅ Assigned to ${chosen.full_name} (${chosen.user_id}) — customer + deal created`);
            }
        } else {
            console.error('[LeadDist] Could not create customer, skipping deal creation');
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
 * Uses round-robin to distribute leads evenly across eligible users
 */
export async function processQueuedLeads(): Promise<number> {
    try {
        // 1. Get all pending leads (oldest first)
        const { data: pendingLeads, error } = await supabase
            .from('marketing_leads')
            .select('id')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error || !pendingLeads || pendingLeads.length === 0) {
            return 0;
        }

        // 2. Get online eligible telesales (sorted by least leads first by SQL)
        const { data: eligibleUsers, error: rpcError } = await supabase
            .rpc('get_online_eligible_telesales');

        if (rpcError) {
            console.error('[LeadDist] RPC error:', rpcError);
            return 0;
        }

        if (!eligibleUsers || eligibleUsers.length === 0) {
            console.log('[LeadDist] No eligible telesales online (or all at quota) — leads stay pending');
            return 0;
        }

        console.log(`[LeadDist] Processing ${pendingLeads.length} pending leads across ${eligibleUsers.length} eligible users...`);

        // 3. Round-robin: cycle through eligible users
        let assigned = 0;
        for (let i = 0; i < pendingLeads.length; i++) {
            const userIndex = i % eligibleUsers.length;
            const targetUser = eligibleUsers[userIndex];

            const result = await assignLeadToTelesales(
                pendingLeads[i].id,
                targetUser.user_id,
                targetUser.full_name
            );

            if (result.assignedTo) {
                assigned++;
            }
        }

        console.log(`[LeadDist] ✅ Round-robin assigned ${assigned}/${pendingLeads.length} pending leads to ${eligibleUsers.length} users`);
        return assigned;

    } catch (error) {
        console.error('[LeadDist] Queue processing error:', error);
        return 0;
    }
}
