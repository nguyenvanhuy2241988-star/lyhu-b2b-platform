import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAIResponse, extractPhoneNumber } from '@/lib/geminiService';
import { createAndAssignLead } from '@/lib/leadDistributionService';

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'lyhu_verify_token_123';

// Helper: send multiple messages with delays (mimics human typing)
async function sendSequentialMessages(recipientId: string, messages: string[], pageToken: string, delayMs: number = 2500) {
    for (let i = 0; i < messages.length; i++) {
        // Show typing indicator
        try {
            await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: recipientId },
                    sender_action: 'typing_on'
                })
            });
        } catch (e) { }

        // Wait before sending (random 2-4 seconds to seem natural)
        const wait = i === 0 ? 1000 : delayMs + Math.floor(Math.random() * 1500);
        await new Promise(resolve => setTimeout(resolve, wait));

        // Send message
        try {
            await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: recipientId },
                    message: { text: messages[i] }
                })
            });
        } catch (e) {
            console.error('Send sequential message error:', e);
        }
    }
}

// Helper to send reply to Facebook
// Helper to send reply to Facebook
async function sendReply(recipientId: string, rule: any, pageToken: string) {
    try {
        let messagePayload: any = { text: rule.response_text };

        // Handle Image
        if (rule.response_type === 'image' && rule.media_url) {
            messagePayload = {
                attachment: {
                    type: 'image',
                    payload: { url: rule.media_url, is_reusable: true }
                }
            };
        }

        // Handle Buttons
        if (rule.buttons && rule.buttons.length > 0) {
            messagePayload = {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'button',
                        text: rule.response_text,
                        buttons: rule.buttons.map((b: any) => {
                            if (b.type === 'web_url') return { type: 'web_url', url: b.url, title: b.title };
                            if (b.type === 'phone_number') return { type: 'phone_number', payload: b.payload, title: b.title };
                            return { type: 'postback', payload: b.payload || b.title, title: b.title };
                        })
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
    } catch (error) {
        console.error('Send reply error:', error);
    }
}

// Helper: detect display name for customer (avoids "anh/chị" for businesses)
function getDisplayName(fullName: string): { name: string; isBusiness: boolean } {
    if (!fullName || fullName === 'Facebook User' || fullName === 'Chưa cập nhật') {
        return { name: 'bạn', isBusiness: false };
    }

    // Simple heuristic: business names often contain these patterns
    const businessPatterns = [
        /^(shop|store|cửa hàng|tiệm|quán|nhà hàng|công ty|tnhh|co\.|ltd)/i,
        /(shop|store|mart|beauty|spa|salon|clinic|studio|boutique|fashion|food|tea|coffee|cake|bakery|pharma|tech|media|group|team|official|brand)$/i,
        /[&@#]/, // Special chars common in business names
        /\b(LLC|Inc|Corp|Ltd|TNHH|JSC|Co\.|Company)\b/i,
    ];

    const isBusiness = businessPatterns.some(p => p.test(fullName));

    if (isBusiness) {
        return { name: fullName, isBusiness: true };
    }

    // For personal names, extract first name (Vietnamese: last word)
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[parts.length - 1];
    return { name: firstName, isBusiness: false };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (body.object !== 'page') {
            return NextResponse.json({ status: 'ignored' });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        for (const entry of body.entry) {
            const pageId = entry.id;

            // Process standby events (for pages where app is secondary receiver)
            if (entry.standby) {
                for (const event of entry.standby) {
                    if (!event.sender || event.sender.id === pageId) continue;

                    const standbyText = event.message?.text || '';
                    const standbyMid = event.message?.mid || '';
                    const standbySenderId = event.sender.id;

                    if (!standbyText && !standbyMid) continue;

                    const { data: pageData } = await supabase
                        .from('facebook_pages')
                        .select('id, access_token, name')
                        .eq('page_id', pageId)
                        .single();

                    if (!pageData) continue;

                    // Check/create conversation
                    const { data: existingStandbyConv } = await supabase
                        .from('social_conversations')
                        .select('id, customer_name')
                        .eq('platform', 'facebook')
                        .eq('external_id', standbySenderId)
                        .single();

                    let convId = existingStandbyConv?.id;

                    if (!convId) {
                        let standbyCustomerName = 'Facebook User';
                        if (pageData.access_token) {
                            try {
                                const convRes = await fetch(
                                    `https://graph.facebook.com/v21.0/${pageId}/conversations?user_id=${standbySenderId}&fields=participants&access_token=${pageData.access_token}`
                                );
                                const convData = await convRes.json();
                                if (convData.data?.[0]?.participants?.data) {
                                    const p = convData.data[0].participants.data.find((p: any) => p.id !== pageId);
                                    if (p?.name) standbyCustomerName = p.name;
                                }
                            } catch (e) { }
                        }

                        const { data: newConv } = await supabase
                            .from('social_conversations')
                            .upsert({
                                platform: 'facebook',
                                external_id: standbySenderId,
                                page_id: pageData.id,
                                customer_name: standbyCustomerName,
                                snippet: standbyText || '[Standby]',
                                unread_count: 1,
                                last_message_at: new Date().toISOString()
                            }, { onConflict: 'platform, external_id' })
                            .select()
                            .single();
                        convId = newConv?.id;
                    } else {
                        await supabase.from('social_conversations').update({
                            snippet: standbyText || '[Standby]',
                            last_message_at: new Date().toISOString(),
                            unread_count: (existingStandbyConv as any)?.unread_count ? (existingStandbyConv as any).unread_count + 1 : 1
                        }).eq('id', convId);
                    }

                    if (convId && standbyMid) {
                        await supabase.from('social_messages').upsert({
                            conversation_id: convId,
                            external_id: standbyMid,
                            content: standbyText || '[Media]',
                            sender_id: standbySenderId,
                            is_from_page: false,
                            created_at: new Date().toISOString()
                        }, { onConflict: 'external_id' });
                    }
                }
                continue;
            }

            if (!entry.messaging) continue;

            for (const event of entry.messaging) {
                // Handle message echoes (messages sent BY the page)
                if (event.message && event.message.is_echo) {
                    const echoText = event.message.text || '';
                    const echoMid = event.message.mid || '';
                    const echoRecipientId = event.recipient?.id === pageId ? event.sender?.id : event.recipient?.id;

                    if (echoRecipientId && echoRecipientId !== pageId) {
                        // Find conversation by recipient
                        const { data: conv } = await supabase
                            .from('social_conversations')
                            .select('id')
                            .eq('platform', 'facebook')
                            .eq('external_id', echoRecipientId)
                            .single();

                        if (conv) {
                            const snippetText = echoText || '[Media]';
                            let echoAttachments: any[] = [];
                            if (event.message.attachments) {
                                echoAttachments = event.message.attachments.map((a: any) => ({
                                    type: a.type,
                                    url: a.payload?.url
                                })).filter((a: any) => a.url);
                            }
                            const msgData: any = {
                                conversation_id: conv.id,
                                external_id: echoMid || `echo_${Date.now()}`,
                                content: snippetText,
                                sender_id: pageId,
                                sender_name: 'Page',
                                is_from_page: true,
                                created_at: new Date().toISOString()
                            };
                            if (echoAttachments.length > 0) {
                                msgData.attachments = echoAttachments;
                            }
                            await supabase.from('social_messages').upsert(msgData, { onConflict: 'external_id' });

                            // Update conversation snippet
                            await supabase.from('social_conversations').update({
                                snippet: snippetText,
                                last_message_at: new Date().toISOString()
                            }).eq('id', conv.id);
                        }
                    }
                    continue; // Skip chatbot logic for echoes
                }

                const senderId = event.sender.id;
                let text = '';
                let mid = '';
                let attachments: any[] = [];

                if (event.message) {
                    text = event.message.text || '';
                    mid = event.message.mid || '';
                    if (event.message.attachments) {
                        attachments = event.message.attachments.map((a: any) => ({
                            type: a.type,
                            url: a.payload?.url,
                            title: a.payload?.title
                        })).filter((a: any) => a.url);
                    }
                } else if (event.postback && event.postback.payload) {
                    text = event.postback.payload;
                    mid = `postback_${Date.now()}`;
                }

                if (text || attachments.length > 0) {
                    // Retrieve Page Data early (needed for fallback fetch)
                    const { data: pageData } = await supabase
                        .from('facebook_pages')
                        .select('id, access_token, name')
                        .eq('page_id', pageId)
                        .single();

                    if (!pageData) {
                        console.error("Page not found:", pageId);
                        continue;
                    }

                    // Check if conversation already exists
                    const { data: existingConv } = await supabase
                        .from('social_conversations')
                        .select('id, customer_name, ad_id, customer_phone')
                        .eq('platform', 'facebook')
                        .eq('external_id', senderId)
                        .single();

                    const isNewConversation = !existingConv;

                    // 1. Get Conversation or Create
                    let referral = (event.message && event.message.referral) || (event.postback && event.postback.referral);

                    // Fetch referral from Graph API for:
                    // 1. NEW conversations (always check)
                    // 2. EXISTING conversations that don't have ad_id yet (retroactive fix)
                    const needsReferralCheck = isNewConversation || (existingConv && !existingConv.ad_id);
                    if (!referral && needsReferralCheck && mid && !mid.startsWith('postback_') && pageData.access_token) {
                        try {
                            // Method 1: Check current message for referral
                            const msgRes = await fetch(`https://graph.facebook.com/v21.0/${mid}?fields=referral,from,message,tags&access_token=${pageData.access_token}`);
                            const msgData = await msgRes.json();
                            if (msgData.referral) {
                                console.log("Found Referral via Graph API (current msg):", msgData.referral);
                                referral = msgData.referral;
                            }

                            // Method 2: Check conversation's FIRST message for referral (ad click creates postback)
                            if (!referral) {
                                try {
                                    const convMsgRes = await fetch(
                                        `https://graph.facebook.com/v21.0/${pageId}/conversations?user_id=${senderId}&fields=messages.limit(1){message,from,tags}&access_token=${pageData.access_token}`
                                    );
                                    const convMsgData = await convMsgRes.json();
                                    const firstConv = convMsgData?.data?.[0];
                                    if (firstConv?.messages?.data) {
                                        // Check if conversation has ad-related tags
                                        for (const msg of firstConv.messages.data) {
                                            if (msg.tags?.some((t: any) => t.name === 'sponsored_message' || t.name === 'ads')) {
                                                console.log("Found ad tag in conversation messages");
                                                referral = { source: 'ADS', ad_id: null };
                                            }
                                        }
                                    }
                                } catch (e2) {
                                    console.error("Conv message check failed:", e2);
                                }
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
                                    `https://graph.facebook.com/v21.0/${senderId}?fields=name,profile_pic&access_token=${pageData.access_token}`
                                );
                                const profileData = await profileRes.json();
                                console.log('Profile API response:', JSON.stringify(profileData));

                                if (profileData.name && !profileData.error) {
                                    customerName = profileData.name;
                                }
                                if (profileData.profile_pic) {
                                    customerAvatar = profileData.profile_pic;
                                }
                            } catch (e) {
                                console.error('Profile API failed:', e);
                            }
                        }
                    }

                    // Build upsert data
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

                    // Auto-detect Vietnamese phone numbers (uses same robust regex as AI)
                    const detectedPhone = extractPhoneNumber(text);
                    if (detectedPhone) {
                        upsertData.customer_phone = detectedPhone;
                    }


                    // Auto-detect Vietnamese region from message
                    const regionKeywords: Record<string, string> = {
                        'hà nội': 'Hà Nội', 'ha noi': 'Hà Nội',
                        'hồ chí minh': 'Hồ Chí Minh', 'ho chi minh': 'Hồ Chí Minh', 'sài gòn': 'Hồ Chí Minh', 'sai gon': 'Hồ Chí Minh',
                        'đà nẵng': 'Đà Nẵng', 'hải phòng': 'Hải Phòng', 'cần thơ': 'Cần Thơ',
                        'hà tĩnh': 'Hà Tĩnh', 'nghệ an': 'Nghệ An', 'thanh hóa': 'Thanh Hóa', 'thanh hoá': 'Thanh Hóa',
                        'đà lạt': 'Đà Lạt', 'nha trang': 'Nha Trang', 'huế': 'Huế',
                        'bình dương': 'Bình Dương', 'đồng nai': 'Đồng Nai', 'long an': 'Long An',
                        'quảng ninh': 'Quảng Ninh', 'hải dương': 'Hải Dương', 'bắc ninh': 'Bắc Ninh',
                        'phú quốc': 'Phú Quốc', 'vũng tàu': 'Vũng Tàu', 'bình thuận': 'Bình Thuận',
                    };
                    const textLowerForRegion = text.toLowerCase();
                    for (const [key, value] of Object.entries(regionKeywords)) {
                        if (textLowerForRegion.includes(key)) {
                            upsertData.customer_region = value;
                            break;
                        }
                    }

                    // Store thread ID if available
                    if (fbThreadId) {
                        upsertData.fb_thread_id = fbThreadId;
                    }

                    if (referral) {
                        upsertData.referral_source = referral.source || 'ADS';
                        upsertData.ad_id = referral.ad_id;
                        upsertData.ref_parameter = referral.ref;
                        upsertData.source_type = 'ads';
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
                        // 2. Insert Message (User's message/postback) — DEDUP CHECK
                        const msgData: any = {
                            conversation_id: conv.id,
                            external_id: mid || `mid_${Date.now()}`,
                            content: text || (attachments.length > 0 ? `[${attachments[0].type === 'image' ? 'Hình ảnh' : 'Tệp tin'}]` : ''),
                            sender_id: senderId,
                            is_from_page: false,
                            created_at: new Date().toISOString()
                        };
                        if (attachments.length > 0) {
                            msgData.attachments = attachments;
                        }

                        // Check if this message was already processed (Facebook webhook retry)
                        const { data: existingMsg } = await supabase
                            .from('social_messages')
                            .select('id')
                            .eq('external_id', msgData.external_id)
                            .maybeSingle();

                        if (existingMsg) {
                            console.log('[DEDUP] Message already processed:', msgData.external_id);
                            continue; // Skip duplicate — don't save or respond again
                        }

                        await supabase.from('social_messages').insert(msgData);

                        // 3. Chatbot Logic
                        if (pageData.access_token) {
                            let ruleMatched = false;

                            const { data: rules } = await supabase
                                .from('chatbot_rules')
                                .select('*')
                                .eq('is_active', true)
                                .or(`page_id.is.null,page_id.eq.${pageData.id}`);

                            if (rules) {
                                for (const rule of rules) {
                                    const textLower = text.toLowerCase();
                                    const keywordLower = rule.keyword.toLowerCase();

                                    let isMatch = false;
                                    if (rule.match_type === 'exact') {
                                        isMatch = textLower === keywordLower;
                                    } else {
                                        isMatch = textLower.includes(keywordLower);
                                    }

                                    if (isMatch) {
                                        ruleMatched = true;
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

                            // 4. AI Gemini Fallback — if no chatbot rule matched
                            // Respond to text messages AND image-only messages (customer sends product photo)
                            if (!ruleMatched && (text || attachments.length > 0)) {
                                // Check if AI is enabled for this page
                                const { data: pageConfig } = await supabase
                                    .from('facebook_pages')
                                    .select('chatbot_config')
                                    .eq('id', pageData.id)
                                    .single();

                                const config = (pageConfig?.chatbot_config as any) || {};
                                const aiEnabled = config.ai_enabled !== false; // Default ON

                                if (aiEnabled) {
                                    try {
                                        // Get recent chat history for context
                                        const { data: recentMsgs } = await supabase
                                            .from('social_messages')
                                            .select('content, is_from_page')
                                            .eq('conversation_id', conv.id)
                                            .order('created_at', { ascending: false })
                                            .limit(6);

                                        const chatHistory = (recentMsgs || []).reverse().map(m => ({
                                            role: m.is_from_page ? 'assistant' : 'customer',
                                            content: m.content
                                        }));

                                        // Check if customer already has phone in conversation
                                        const hasPhone = !!(conv as any).customer_phone;

                                        // For image-only messages, create a descriptive text for AI
                                        const aiText = text || '[Khách gửi hình ảnh sản phẩm/quảng cáo]';

                                        const aiResult = await getAIResponse(
                                            aiText,
                                            customerName,
                                            isNewConversation,
                                            hasPhone,
                                            chatHistory
                                        );

                                        if (aiResult.messages.length > 0) {
                                            console.log(`[AI] State: ${aiResult.state}, Messages: ${aiResult.messages.length}`);

                                            // Send messages sequentially with typing delays
                                            await sendSequentialMessages(
                                                senderId,
                                                aiResult.messages,
                                                pageData.access_token,
                                                2500
                                            );

                                            // Save ALL AI replies to DB at once
                                            const aiMsgInserts = aiResult.messages.map((msg, i) => ({
                                                conversation_id: conv.id,
                                                content: `[AI]: ${msg}`,
                                                sender_id: pageId,
                                                is_from_page: true,
                                                created_at: new Date(Date.now() + i * 100).toISOString()
                                            }));
                                            await supabase.from('social_messages').insert(aiMsgInserts);

                                            // Update conversation snippet with last AI message
                                            await supabase.from('social_conversations').update({
                                                snippet: `[AI]: ${aiResult.messages[aiResult.messages.length - 1]}`,
                                                last_message_at: new Date().toISOString(),
                                                needs_followup: !hasPhone && !aiResult.phoneDetected
                                            }).eq('id', conv.id);
                                        }

                                        // If AI detected a phone number, update conversation
                                        if (aiResult.phoneDetected) {
                                            await supabase.from('social_conversations').update({
                                                customer_phone: aiResult.phoneDetected,
                                                needs_followup: false
                                            }).eq('id', conv.id);
                                            console.log(`[AI] Phone detected: ${aiResult.phoneDetected}`);

                                            // Auto-create lead for telesales distribution
                                            try {
                                                await createAndAssignLead(conv.id);
                                                console.log(`[Lead] Auto-created lead for conv ${conv.id}`);
                                            } catch (leadErr) {
                                                console.error('[Lead] Auto-create failed:', leadErr);
                                            }
                                        }

                                        // If phone was detected from the message text directly
                                        if (detectedPhone && !aiResult.phoneDetected) {
                                            await supabase.from('social_conversations').update({
                                                customer_phone: detectedPhone,
                                                needs_followup: false
                                            }).eq('id', conv.id);

                                            // Auto-create lead
                                            try {
                                                await createAndAssignLead(conv.id);
                                                console.log(`[Lead] Auto-created lead for detected phone in conv ${conv.id}`);
                                            } catch (leadErr) {
                                                console.error('[Lead] Auto-create failed:', leadErr);
                                            }
                                        }
                                    } catch (aiError) {
                                        console.error('[AI] Error:', aiError);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}
