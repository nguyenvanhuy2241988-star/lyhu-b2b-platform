import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { detectGender, callGeminiAI } from '@/lib/geminiService';

/**
 * Cron Job: Multi-tier follow-up for customers who haven't left phone numbers
 * 
 * Tier 1 (after 4 hours):  Gentle ask for phone
 * Tier 2 (after 1 day):    Friendly reminder with value prop
 * Tier 3 (after 3 days):   Polite final message
 * 
 * Uses Gemini AI to generate natural, human-like messages each time.
 * Max 3 follow-ups per conversation → then stops completely.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Follow-up tier configuration
const FOLLOWUP_TIERS = [
    { tier: 1, minHours: 4, prompt: 'Nhắn 1 tin nhắn NGẮN GỌN xin số điện thoại, giọng điệu nhẹ nhàng quan tâm, như nhân viên thật đang nhắn. KHÔNG nhắc rằng đây là lần nhắc nhở.' },
    { tier: 2, minHours: 24, prompt: 'Nhắn 1 tin nhắn NGẮN GỌN nhắc nhở xin SĐT, thân thiện và tự nhiên hơn, có thể nhắc bên em đang có chương trình tốt. KHÔNG dùng từ "nhắc lại" hay "follow-up".' },
    { tier: 3, minHours: 72, prompt: 'Nhắn 1 tin nhắn NGẮN GỌN cuối cùng, lịch sự kết thúc, nói khi nào cần tư vấn cứ nhắn em. KHÔNG spam, KHÔNG ép buộc.' },
];

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Allow manual trigger with ?force=1 to skip timing checks (for debugging)
        const url = new URL(request.url);
        const forceMode = url.searchParams.get('force') === '1';

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );


        // Mark expired conversations (>7 days) as no longer needing follow-up
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: expiredData } = await supabase
            .from('social_conversations')
            .update({ needs_followup: false, followup_sent: true })
            .eq('needs_followup', true)
            .is('customer_phone', null)
            .lt('last_message_at', sevenDaysAgo)
            .select('id');
        const expiredCount = expiredData?.length || 0;

        if (expiredCount && expiredCount > 0) {
            console.log(`[Follow-up] Marked ${expiredCount} expired conversations (>7 days)`);
        }

        // Find conversations needing follow-up:
        // - needs_followup = true
        // - No customer_phone
        // - followup_count < 3 (max 3 attempts)
        // - last_message_at within 7 days (Facebook messaging window)
        const { data: conversations } = await supabase
            .from('social_conversations')
            .select(`
                id, external_id, customer_name, customer_phone,
                page_id, last_message_at, followup_count,
                facebook_pages!inner(page_id, access_token, chatbot_config)
            `)
            .eq('needs_followup', true)
            .is('customer_phone', null)
            .lt('followup_count', 3)
            .gte('last_message_at', sevenDaysAgo)
            .order('last_message_at', { ascending: true })
            .limit(forceMode ? 5 : 20);

        if (!conversations || conversations.length === 0) {
            return NextResponse.json({ success: true, followups_sent: 0, message: 'No pending follow-ups' });
        }

        let sent = 0;
        const now = Date.now();
        const startTime = Date.now();
        const MAX_EXECUTION_MS = 240_000; // Stop processing at 240s to respond before Vercel 300s limit
        const skipped = { no_token: 0, ai_disabled: 0, too_early: 0, ai_failed: 0, send_failed: 0, time_limit: 0 };

        for (const conv of conversations) {
            // Guard: stop if running too long
            if (Date.now() - startTime > MAX_EXECUTION_MS) {
                skipped.time_limit = conversations.length - conversations.indexOf(conv);
                console.log(`[Follow-up] Time limit reached at ${Math.round((Date.now() - startTime) / 1000)}s, stopping.`);
                break;
            }

            const page = (conv as any).facebook_pages;
            if (!page?.access_token) { skipped.no_token++; continue; }

            // Check if AI is enabled
            const config = (page.chatbot_config as any) || {};
            if (config.ai_enabled === false) { skipped.ai_disabled++; continue; }

            const currentCount = conv.followup_count || 0;
            const tierConfig = FOLLOWUP_TIERS[currentCount];
            if (!tierConfig) continue;

            // Check timing — enough hours passed since last message?
            const lastMsgTime = new Date(conv.last_message_at).getTime();
            const hoursSinceLastMsg = (now - lastMsgTime) / (1000 * 60 * 60);

            if (!forceMode && hoursSinceLastMsg < tierConfig.minHours) {
                skipped.too_early++;
                continue; // Too early for this tier
            }

            const honorific = detectGender(conv.customer_name || '');
            const customerName = conv.customer_name || 'bạn';

            // Use Gemini AI with a strict 10s timeout to avoid hanging
            let aiMessage = '';
            try {
                aiMessage = await Promise.race([
                    callGeminiAI(
                        tierConfig.prompt,
                        customerName,
                        honorific,
                        [], // No chat history needed for follow-up
                        false // hasPhone = false, we want phone
                    ),
                    new Promise<string>((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 10000))
                ]);
            } catch (e: any) {
                console.error(`[Follow-up] AI timeout/error for ${customerName}:`, e.message);
                skipped.ai_failed++;
                continue;
            }

            if (!aiMessage) {
                console.log(`[Follow-up] AI returned empty for ${customerName}, skipping`);
                skipped.ai_failed++;
                continue;
            }

            // Split into short messages if multiline
            const messages = aiMessage.split('\n').filter(m => m.trim());

            // Send messages (no typing simulation in cron — send directly)
            let sendSuccess = true;
            for (let i = 0; i < messages.length; i++) {
                // Small delay between messages
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                // Send message with HUMAN_AGENT tag (extends messaging window to 7 days)
                try {
                    const sendRes = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${page.access_token}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messaging_type: 'MESSAGE_TAG',
                            tag: 'HUMAN_AGENT',
                            recipient: { id: conv.external_id },
                            message: { text: messages[i] }
                        })
                    });
                    const sendData = await sendRes.json();
                    if (sendData.error) {
                        console.error(`[Follow-up] FB Send error for ${customerName}:`, JSON.stringify(sendData.error));
                        sendSuccess = false;
                        break;
                    }
                } catch (e: any) {
                    console.error(`[Follow-up] FB Send exception for ${customerName}:`, e.message);
                    sendSuccess = false;
                    break;
                }
            }

            if (!sendSuccess) {
                skipped.send_failed++;
                continue; // Skip DB update if send failed
            }

            // Save follow-up messages to DB (only if sent successfully)
            for (const msg of messages) {
                await supabase.from('social_messages').insert({
                    conversation_id: conv.id,
                    content: `[AI Follow-up #${currentCount + 1}]: ${msg}`,
                    sender_id: page.page_id,
                    is_from_page: true,
                    created_at: new Date().toISOString()
                });
            }

            // Update follow-up count (only if sent successfully)
            await supabase.from('social_conversations').update({
                followup_count: currentCount + 1,
                followup_sent: currentCount + 1 >= 3,
                last_message_at: new Date().toISOString()
            }).eq('id', conv.id);

            sent++;
            console.log(`[Follow-up] ✅ Tier ${currentCount + 1} sent to ${customerName} (${hoursSinceLastMsg.toFixed(1)}h since last msg)`);

            // Small delay between customers to avoid FB rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`[Follow-up] Done. Sent: ${sent}, Checked: ${conversations.length}, Expired: ${expiredCount || 0}, Skipped:`, skipped);
        return NextResponse.json({
            success: true,
            followups_sent: sent,
            total_checked: conversations.length,
            expired_marked: expiredCount || 0,
            skipped,
            force_mode: forceMode,
            model: 'gemini-2.5-flash-lite'
        });

    } catch (error: any) {
        console.error('[Follow-up] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
