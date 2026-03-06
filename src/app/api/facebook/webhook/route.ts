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



// Helper: Public Comment Reply
async function sendCommentReply(commentId: string, rule: any, pageToken: string) {
    try {
        let messageText = rule.response_text || "";
        // If image, append URL (Comments support attachment_url but text is safer/simpler for now)
        if (rule.response_type === 'image' && rule.media_url) {
            // Use attachment_url if text is empty? Or both?
            // FB API supports `message` OR `attachment_url` or `source`.
            // Let's keep it simple: Text.
            messageText += ` ${rule.media_url}`;
        }

        await fetch(`https://graph.facebook.com/v19.0/${commentId}/comments?access_token=${pageToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageText })
        });
    } catch (e) { console.error("Comment Reply Error", e); }
}

// Helper: Private Inbox Reply (from Comment)
async function sendPrivateReply(commentId: string, rule: any, pageToken: string) {
    try {
        // Same payload logic as sendReply
        let messagePayload: any = { text: rule.response_text };
        if (rule.response_type === 'image' && rule.media_url) {
            messagePayload = {
                attachment: { type: "image", payload: { url: rule.media_url, is_reusable: true } }
            };
        }

        await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { comment_id: commentId },
                message: messagePayload
            })
        });
    } catch (e) { console.error("Private Reply Error", e); }
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
                // Handle both messaging (primary) and standby (handover) events
                const events = [...(entry.messaging || []), ...(entry.standby || [])];

                if (events.length > 0) {
                    for (const event of events) {
                        console.log("Webhook Event Received:", JSON.stringify(event, null, 2));

                        // Handle Message Echoes (messages sent BY the Page)
                        if (event.message && event.message.is_echo) {
                            const echoText = event.message.text || '';
                            const echoMid = event.message.mid;
                            const recipientId = event.recipient?.id;

                            if (echoText && recipientId) {
                                const { data: pageData } = await supabase
                                    .from('facebook_pages')
                                    .select('id')
                                    .eq('page_id', pageId)
                                    .single();

                                if (pageData) {
                                    // Find the conversation for this recipient
                                    const { data: conv } = await supabase
                                        .from('social_conversations')
                                        .select('id')
                                        .eq('platform', 'facebook')
                                        .eq('external_id', recipientId)
                                        .single();

                                    if (conv) {
                                        // Save echo as page message (avoid duplicate via upsert)
                                        await supabase.from('social_messages').upsert({
                                            conversation_id: conv.id,
                                            external_id: echoMid || `echo_${Date.now()}`,
                                            content: echoText,
                                            sender_id: pageId,
                                            sender_name: 'Page',
                                            is_from_page: true,
                                            created_at: new Date().toISOString()
                                        }, { onConflict: 'external_id' });

                                        // Update conversation snippet
                                        await supabase.from('social_conversations').update({
                                            snippet: echoText,
                                            last_message_at: new Date().toISOString()
                                        }).eq('id', conv.id);
                                    }
                                }
                            }
                            continue; // Skip chatbot logic for echoes
                        }

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
                            // Retrieve Page Data early (needed for fallback fetch)
                            const { data: pageData } = await supabase
                                .from('facebook_pages')
                                .select('id, access_token')
                                .eq('page_id', pageId)
                                .single();

                            if (!pageData) {
                                console.error("Page not found:", pageId);
                                continue;
                            }

                            // Check if conversation already exists
                            const { data: existingConv } = await supabase
                                .from('social_conversations')
                                .select('id, customer_name')
                                .eq('platform', 'facebook')
                                .eq('external_id', senderId)
                                .single();

                            const isNewConversation = !existingConv;

                            // 1. Get Conversation or Create
                            let referral = (event.message && event.message.referral) || (event.postback && event.postback.referral);

                            // FIX #2: Only fetch referral from Graph API for NEW conversations
                            if (!referral && isNewConversation && mid && !mid.startsWith('postback_') && pageData.access_token) {
                                try {
                                    const msgRes = await fetch(`https://graph.facebook.com/v21.0/${mid}?fields=referral,from,message,tags&access_token=${pageData.access_token}`);
                                    const msgData = await msgRes.json();
                                    if (msgData.referral) {
                                        console.log("Found Referral via Graph API:", msgData.referral);
                                        referral = msgData.referral;
                                    }
                                } catch (e) {
                                    console.error("Failed to fetch message details:", e);
                                }
                            }

                            // FIX #1: Fetch real customer name and avatar
                            let customerName = existingConv?.customer_name || 'Facebook User';
                            let customerAvatar = '';
                            let fbThreadId = '';
                            if ((isNewConversation || customerName === 'Facebook User' || customerName === 'Chưa cập nhật') && pageData.access_token) {
                                // Method 1: Try Conversations API (works with basic page permissions)
                                try {
                                    const convRes = await fetch(
                                        `https://graph.facebook.com/v21.0/${pageId}/conversations?user_id=${senderId}&fields=participants&access_token=${pageData.access_token}`
                                    );
                                    const convData = await convRes.json();
                                    console.log('Conversations API response:', JSON.stringify(convData));

                                    if (convData.data?.[0]) {
                                        // Capture Facebook thread ID for Business Suite linking
                                        fbThreadId = convData.data[0].id || '';

                                        if (convData.data[0].participants?.data) {
                                            const participant = convData.data[0].participants.data.find(
                                                (p: any) => p.id !== pageId
                                            );
                                            if (participant?.name) {
                                                customerName = participant.name;
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.error('Conversations API failed:', e);
                                }

                                // Method 2: Fallback to Profile API (needs Advanced Access)
                                if (customerName === 'Facebook User') {
                                    try {
                                        const profileRes = await fetch(
                                            `https://graph.facebook.com/v21.0/${senderId}?fields=first_name,last_name,profile_pic&access_token=${pageData.access_token}`
                                        );
                                        const profileData = await profileRes.json();
                                        if (profileData.first_name) {
                                            customerName = profileData.last_name
                                                ? `${profileData.first_name} ${profileData.last_name}`
                                                : profileData.first_name;
                                        }
                                        if (profileData.profile_pic) {
                                            customerAvatar = profileData.profile_pic;
                                        }
                                    } catch (e) {
                                        console.error('Profile API failed:', e);
                                    }
                                }
                            }
                            // Fallback avatar
                            if (!customerAvatar && pageData.access_token) {
                                customerAvatar = `https://graph.facebook.com/${senderId}/picture?type=normal&access_token=${pageData.access_token}`;
                            }

                            console.log("Referral Data:", referral);

                            const upsertData: any = {
                                platform: 'facebook',
                                external_id: senderId,
                                page_id: pageData.id,
                                customer_name: customerName,
                                customer_avatar: customerAvatar,
                                snippet: text,
                                unread_count: 1,
                                last_message_at: new Date().toISOString()
                            };

                            // Auto-detect Vietnamese phone numbers from customer messages
                            const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/g;
                            const phoneMatch = text.match(phoneRegex);
                            if (phoneMatch) {
                                upsertData.customer_phone = phoneMatch[0];
                            }

                            // Store thread ID if available
                            if (fbThreadId) {
                                upsertData.fb_thread_id = fbThreadId;
                            }

                            if (referral) {
                                upsertData.referral_source = referral.source || 'ADS';
                                upsertData.ad_id = referral.ad_id;
                                upsertData.ref_parameter = referral.ref;
                                if (referral.ad_id) {
                                    upsertData.ad_title = `QC #${referral.ad_id}`;
                                }
                            }

                            const { data: conv, error: convError } = await supabase
                                .from('social_conversations')
                                .upsert(upsertData, { onConflict: 'platform, external_id' })
                                .select()
                                .single();

                            if (conv) {
                                // Update page_id just in case
                                // Already done in upsert if new, but if old, upsert updates it.
                                // Logic simplified.

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

                            // 2b. Chatbot Auto-Reply Logic (Comments)
                            if (pageData && pageData.access_token && message) {
                                // Fetch Active Rules (Optimize: Cache or Fetch once)
                                // We fetch rules here.
                                const { data: rules } = await supabase
                                    .from('chatbot_rules')
                                    .select('*')
                                    .eq('is_active', true)
                                    .or(`page_id.is.null,page_id.eq.${pageData.id}`);

                                if (rules) {
                                    for (const rule of rules) {
                                        const textLower = message.toLowerCase();
                                        const keywordLower = rule.keyword.toLowerCase();
                                        let isMatch = false;
                                        if (rule.match_type === 'exact') isMatch = textLower === keywordLower;
                                        else isMatch = textLower.includes(keywordLower);

                                        if (isMatch) {
                                            console.log(`[Auto-Reply] Comment Match: ${rule.keyword}`);
                                            // Public Reply
                                            await sendCommentReply(comment_id, rule, pageData.access_token);

                                            // Private Reply (Optional - If configured later, but for now Auto-Reply usually means Public)
                                            // If you want Private Auto-Reply, maybe check a flag in rule? 
                                            // For now, let's assume Rules apply to Public Reply for comments.
                                            // BUT if type is "Auto-Inbox", use private. 
                                            // My rule schema doesn't have "reply_method".
                                            // Adding "Auto-Inbox" Logic if implied?
                                            // Let's do BOTH if Keyword matches? Or just Public?
                                            // Standard is Public. Private is aggressive.
                                            // I'll stick to Public for now.
                                            break;
                                        }
                                    }
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
