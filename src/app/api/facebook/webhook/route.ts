import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'lyhu_verify_token_123';

// Helper to send reply to Facebook
// Helper to send reply to Facebook
async function sendReply(recipientId: string, rule: any, pageToken: string) {
    try {
        let messagePayload: any = { text: rule.response_text };

        // Handle Image
        if (rule.response_type === 'image' && rule.media_url) {
            messagePayload = {
                attachment: {
                    type: "image",
                    payload: {
                        url: rule.media_url,
                        is_reusable: true
                    }
                }
            };
        }
        // Handle Buttons (Quick Reply or Button Template)
        // Note: For simplicity, using Button Template if buttons exist
        else if (rule.buttons && rule.buttons.length > 0) {
            messagePayload = {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: rule.response_text || "Vui lòng chọn:",
                        buttons: rule.buttons
                    }
                }
            };
        }

        await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: messagePayload
            })
        });
    } catch (e) {
        console.error("Send Reply Error:", e);
    }
}



export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    } else {
        return new NextResponse('Forbidden', { status: 403 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (body.object === 'page') {
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            for (const entry of body.entry) {
                const pageId = entry.id; // Recipient (The Page)
                const messaging = entry.messaging;

                if (messaging) {
                    for (const event of messaging) {
                        const senderId = event.sender.id;
                        const message = event.message;

                        if (message && message.text) {
                            // 1. Get Conversation or Create
                            // We need to find or create conversation linked to this page and sender
                            const { data: conv, error: convError } = await supabase
                                .from('social_conversations')
                                .upsert({
                                    platform: 'facebook',
                                    external_id: senderId, // This might be senderId for direct messages? Actually FB uses Thread ID (t_...) usually, but webhook gives sender.id. 
                                    // For simplicity in MVP, we act as if Sender ID is Key. 
                                    // Ideally we should use the Thread ID if available. 
                                    // Webhook doesn't always send thread_id in entry.
                                    // We will use senderId as external_id for now (User PSID).
                                    page_id: null, // We need to find our internal page_id uuid. 
                                    // For now, let's look it up.
                                    customer_name: 'Facebook User', // We can fetch name later
                                    snippet: message.text,
                                    unread_count: 1, // Increment? Hard to do atomic increment in upsert without refined logic.
                                    last_message_at: new Date().toISOString()
                                }, { onConflict: 'platform, external_id' }) // Make sure this constraint matches
                                .select()
                                .single();

                            // Update page_id if we have it
                            // Retrieve Page UUID
                            const { data: pageData } = await supabase
                                .from('facebook_pages')
                                .select('id, access_token')
                                .eq('page_id', pageId)
                                .single();

                            if (pageData && conv) {
                                await supabase
                                    .from('social_conversations')
                                    .update({ page_id: pageData.id })
                                    .eq('id', conv.id);

                                // 2. Insert Message
                                await supabase.from('social_messages').insert({
                                    conversation_id: conv.id,
                                    external_id: message.mid || `mid_${Date.now()}`,
                                    content: message.text,
                                    sender_id: senderId,
                                    is_from_page: false,
                                    created_at: new Date().toISOString()
                                });

                                // 3. Chatbot Logic
                                if (pageData.access_token) {
                                    const { data: rules } = await supabase
                                        .from('chatbot_rules')
                                        .select('*')
                                        .eq('is_active', true)
                                        .or(`page_id.is.null,page_id.eq.${pageData.id}`);

                                    if (rules) {
                                        for (const rule of rules) {
                                            const textLower = message.text.toLowerCase();
                                            const keywordLower = rule.keyword.toLowerCase();

                                            // Simple 'Contains' Match
                                            if (textLower.includes(keywordLower)) {
                                                await sendReply(senderId, rule, pageData.access_token);

                                                // Save Bot Reply to DB
                                                await supabase.from('social_messages').insert({
                                                    conversation_id: conv.id,
                                                    content: `[Bot]: ${rule.response_text || '[Image]'}`,
                                                    sender_id: pageId,
                                                    is_from_page: true,
                                                    created_at: new Date().toISOString()
                                                });
                                                break; // Reply only once
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return new NextResponse('EVENT_RECEIVED', { status: 200 });
        } else {
            return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error) {
        console.error('Webhook Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
