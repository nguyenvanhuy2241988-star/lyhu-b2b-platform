export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { page_id, limit = 50 } = await request.json();

        if (!page_id) {
            return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
        }

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false }
        });

        // 1. Get Page Access Token
        let query = supabase.from('facebook_pages').select('access_token, id, page_id');
        if (page_id.includes('-')) {
            query = query.eq('id', page_id);
        } else {
            query = query.eq('page_id', page_id);
        }

        const { data: pageData } = await query.single();

        if (!pageData || !pageData.access_token) {
            return NextResponse.json({ error: 'Page not found or no access token' }, { status: 404 });
        }

        const fbPageId = pageData.page_id;

        // 2. Fetch Conversations from Facebook (with pagination)
        const fields = 'id,updated_time,messages.limit(100){message,created_time,from,to,attachments{file_url,image_data,mime_type,name,size}},senders,snippet_is_read_only,unread_count,snippet,link';
        let nextUrl: string | null = `https://graph.facebook.com/v19.0/me/conversations?fields=${fields}&limit=${limit}&access_token=${pageData.access_token}`;
        let allConversations: any[] = [];
        let pageCount = 0;
        const MAX_PAGES = 5;

        while (nextUrl && pageCount < MAX_PAGES) {
            const response: Response = await fetch(nextUrl);
            const data: any = await response.json();

            if (data.error) {
                return NextResponse.json({ error: data.error.message }, { status: 400 });
            }

            if (data.data) {
                allConversations = [...allConversations, ...data.data];
            }

            nextUrl = data.paging?.next || null;
            pageCount++;
        }

        let count = 0;

        // 3. Sync to Database
        for (const conv of allConversations) {
            const senders = conv.senders?.data || [];
            const customer = senders.find((s: any) => s.id !== fbPageId) || senders[0];
            const customerName = customer?.name || 'Facebook User';
            const customerId = customer?.id;

            if (!customerId) {
                console.warn("Skipping conversation without sender ID:", conv.id);
                continue;
            }

            // Detect ad source from messages
            let isFromAd = false;
            let adId = '';
            const messagesData = conv.messages?.data || [];

            // Check first message from page (usually automated ad response)
            // In Meta, ads create conversations starting with the page's welcome message
            const firstPageMsg = [...messagesData].reverse().find((m: any) => m.from?.id === fbPageId);
            if (firstPageMsg) {
                const msgText = (firstPageMsg.message || '').toLowerCase();
                // Page's first automated message often contains ad keywords
                if (msgText.includes('quáº£ng cÃ¡o') || msgText.includes('Æ°u Ä‘Ã£i') ||
                    msgText.includes('khuyáº¿n mÃ£i') || msgText.includes('npp') ||
                    msgText.includes('Ä‘áº¡i lÃ½') || msgText.includes('tÃ¬m Ä‘áº¡i lÃ½') ||
                    msgText.includes('nhÃ  phÃ¢n phá»‘i') || msgText.includes('mua 10 táº·ng')) {
                    isFromAd = true;
                }
            }

            // Also try to detect ad from first message's referral via Graph API
            const firstMsg = [...messagesData].reverse()[0];
            if (firstMsg && !isFromAd) {
                try {
                    const msgRes = await fetch(
                        `https://graph.facebook.com/v21.0/${firstMsg.id}?fields=referral&access_token=${pageData.access_token}`
                    );
                    const msgData = await msgRes.json();
                    if (msgData.referral) {
                        isFromAd = true;
                        adId = msgData.referral.ad_id || '';
                    }
                } catch (e) {
                    // Silently continue - referral check is optional
                }
            }

            // Build upsert data
            const upsertData: any = {
                platform: 'facebook',
                external_id: customerId,
                page_id: pageData.id,
                customer_name: customerName,
                customer_avatar: `https://graph.facebook.com/${customerId}/picture?type=normal`,
                snippet: conv.snippet,
                unread_count: conv.unread_count,
                last_message_at: conv.updated_time,
                fb_thread_id: conv.id,
                customer_profile_url: conv.link || null,
            };

            // Set ad source info
            if (isFromAd) {
                upsertData.referral_source = 'ADS';
                upsertData.source_type = 'ads';
                if (adId) {
                    upsertData.ad_id = adId;
                    upsertData.ad_title = `QC #${adId}`;
                }
            }

            const { data: insertedConv, error: insertError } = await supabase
                .from('social_conversations')
                .upsert(upsertData, { onConflict: 'platform, external_id' })
                .select()
                .single();

            if (insertedConv) {
                count++;
                if (messagesData.length > 0) {
                    const messages = messagesData.map((m: any) => {
                        // Extract attachments
                        const msgAttachments = m.attachments?.data?.map((a: any) => ({
                            type: a.mime_type?.startsWith('image') ? 'image' : 'file',
                            url: a.image_data?.url || a.file_url || '',
                            name: a.name || 'attachment'
                        })).filter((a: any) => a.url) || [];

                        return {
                            conversation_id: insertedConv.id,
                            external_id: m.id,
                            content: m.message || (msgAttachments.length > 0 ? `[${msgAttachments[0].type === 'image' ? 'HÃ¬nh áº£nh' : 'Tá»‡p tin'}]` : ''),
                            sender_id: m.from?.id,
                            sender_name: m.from?.name,
                            created_at: m.created_time,
                            is_from_page: m.from?.id === fbPageId,
                            ...(msgAttachments.length > 0 ? { attachments: msgAttachments } : {})
                        };
                    });

                    if (messages.length > 0) {
                        await supabase.from('social_messages').upsert(messages, { onConflict: 'external_id' });
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            count,
            message: `Äá»“ng bá»™ thÃ nh cÃ´ng ${count} há»™i thoáº¡i`
        });
    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

