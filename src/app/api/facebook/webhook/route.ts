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
                        let text = '';
                        let mid = '';

                        if (event.message && event.message.text) {
                            text = event.message.text;
                            mid = event.message.mid;
                        } else if (event.postback && event.postback.payload) {
                            text = event.postback.payload;
                            mid = `postback_${Date.now()}`;
                        }

                        if (text) {
                            // 1. Get Conversation or Create
                            const { data: conv, error: convError } = await supabase
                                .from('social_conversations')
                                .upsert({
                                    platform: 'facebook',
                                    external_id: senderId,
                                    page_id: null, // Will update below
                                    customer_name: 'Facebook User',
                                    snippet: text,
                                    unread_count: 1,
                                    last_message_at: new Date().toISOString()
                                }, { onConflict: 'platform, external_id' })
                                .select()
                                .single();

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

                                // 2. Insert Message (User's message/postback)
                                await supabase.from('social_messages').insert({
                                    conversation_id: conv.id,
                                    external_id: mid || `mid_${Date.now()}`,
                                    content: text,
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
                                            const textLower = text.toLowerCase();
                                            const keywordLower = rule.keyword.toLowerCase();

                                            // Simple 'Contains' Match
                                            // Ensure exact match for Postback/Welcome usually?
                                            // But configured per rule (match_type).
                                            let isMatch = false;
                                            if (rule.match_type === 'exact') {
                                                isMatch = textLower === keywordLower;
                                            } else {
                                                isMatch = textLower.includes(keywordLower);
                                            }

                                            if (isMatch) {
                                                await sendReply(senderId, rule, pageData.access_token);

                                                // Save Bot Reply
                                                await supabase.from('social_messages').insert({
                                                    conversation_id: conv.id,
                                                    content: `[Bot]: ${rule.response_text || '[Image]'}`,
                                                    sender_id: pageId,
                                                    is_from_page: true,
                                                    created_at: new Date().toISOString()
                                                });
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // --- Handle Feed (Comments) ---
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                            const { comment_id, message, post_id, sender_id, sender_name } = change.value;

                            // 1. Fetch Page Config
                            const { data: pageData } = await supabase
                                .from('facebook_pages')
                                .select('id, access_token, chatbot_config')
                                .eq('page_id', pageId)
                                .single();

                            if (pageData && pageData.access_token && pageData.chatbot_config?.auto_hide_phone) {
                                // 2. Check for Phone Number (VN Format)
                                const phoneRegex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/g;
                                if (message && phoneRegex.test(message)) {
                                    console.log(`[Auto-Hide] Hiding comment ${comment_id} due to phone number.`);

                                    // 3. Call Graph API to Hide
                                    await fetch(`https://graph.facebook.com/v19.0/${comment_id}?access_token=${pageData.access_token}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ is_hidden: true })
                                    });
                                }
                            }

                            // Inbox Sync Logic
                            if (message && pageData) {
                                const { data: conv } = await supabase
                                    .from('social_conversations')
                                    .upsert({
                                        platform: 'facebook',
                                        external_id: sender_id || `unknown_${Date.now()}`,
                                        page_id: pageData.id,
                                        customer_name: sender_name || 'Facebook User',
                                        snippet: message,
                                        unread_count: 1,
                                        last_message_at: new Date().toISOString()
                                    }, { onConflict: 'platform, external_id' })
                                    .select().single();

                                if (conv) {
                                    await supabase.from('social_messages').insert({
                                        conversation_id: conv.id,
                                        external_id: comment_id,
                                        content: message,
                                        sender_id: sender_id || 'unknown',
                                        sender_name: sender_name,
                                        is_from_page: false,
                                        created_at: new Date().toISOString()
                                    });
                                }
                            }
                        }
                    }
                }
            } // End of entry loop
            return new NextResponse('EVENT_RECEIVED', { status: 200 });
        } else {
            return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error) {
        console.error('Webhook Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
