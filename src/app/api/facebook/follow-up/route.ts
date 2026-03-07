import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateFollowUpMessages, detectGender } from '@/lib/geminiService';

/**
 * Cron Job: Follow up with customers who haven't left phone numbers
 * Runs once daily (configured in vercel.json)
 * Sends a gentle follow-up message via Messenger
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret (optional security)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Find conversations that need follow-up:
        // - needs_followup = true
        // - followup_sent = false
        // - last_message_at > 1 day ago
        // - has no customer_phone
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: conversations } = await supabase
            .from('social_conversations')
            .select(`
                id, external_id, customer_name, customer_phone,
                page_id, last_message_at,
                facebook_pages!inner(page_id, access_token, chatbot_config)
            `)
            .eq('needs_followup', true)
            .eq('followup_sent', false)
            .is('customer_phone', null)
            .lt('last_message_at', oneDayAgo)
            .limit(50);

        if (!conversations || conversations.length === 0) {
            return NextResponse.json({ success: true, followups_sent: 0 });
        }

        let sent = 0;

        for (const conv of conversations) {
            const page = (conv as any).facebook_pages;
            if (!page?.access_token) continue;

            // Check if AI is enabled
            const config = (page.chatbot_config as any) || {};
            if (config.ai_enabled === false) continue;

            const honorific = detectGender(conv.customer_name || '');
            const messages = generateFollowUpMessages(conv.customer_name || 'bạn', honorific);

            // Send follow-up messages with typing delays
            for (let i = 0; i < messages.length; i++) {
                // Typing indicator
                try {
                    await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${page.access_token}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipient: { id: conv.external_id },
                            sender_action: 'typing_on'
                        })
                    });
                } catch (e) { }

                // Delay between messages (2-4 seconds)
                const wait = i === 0 ? 1000 : 2500 + Math.floor(Math.random() * 1500);
                await new Promise(resolve => setTimeout(resolve, wait));

                // Send message
                try {
                    await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${page.access_token}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipient: { id: conv.external_id },
                            message: { text: messages[i] }
                        })
                    });
                } catch (e) {
                    console.error(`[Follow-up] Send error for ${conv.customer_name}:`, e);
                }
            }

            // Save follow-up messages to DB
            for (const msg of messages) {
                await supabase.from('social_messages').insert({
                    conversation_id: conv.id,
                    content: `[AI Follow-up]: ${msg}`,
                    sender_id: page.page_id,
                    is_from_page: true,
                    created_at: new Date().toISOString()
                });
            }

            // Mark follow-up as sent
            await supabase.from('social_conversations').update({
                followup_sent: true,
                last_message_at: new Date().toISOString()
            }).eq('id', conv.id);

            sent++;
            console.log(`[Follow-up] Sent to ${conv.customer_name}`);
        }

        return NextResponse.json({
            success: true,
            followups_sent: sent,
            total_pending: conversations.length
        });

    } catch (error: any) {
        console.error('[Follow-up] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
