import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { conversation_id, message, page_token, recipient_id, attachment_url, attachment_type } = await request.json();

        if ((!message && !attachment_url) || (!conversation_id && !recipient_id)) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false }
        });

        let finalRecipientId = recipient_id;
        let finalPageToken = page_token;
        let finalConversationId = conversation_id;

        // If no page_token provided, lookup from DB
        if (!finalPageToken && conversation_id) {
            const { data: conv } = await supabase
                .from('social_conversations')
                .select('page_id, external_id')
                .eq('id', conversation_id)
                .single();

            if (conv) {
                finalRecipientId = finalRecipientId || conv.external_id;

                const { data: pageData } = await supabase
                    .from('facebook_pages')
                    .select('access_token, page_id')
                    .eq('id', conv.page_id)
                    .single();

                if (pageData?.access_token) {
                    finalPageToken = pageData.access_token;
                }
            }
        }

        if (!finalPageToken) {
            return NextResponse.json({ error: 'Missing page_token — could not resolve from DB' }, { status: 400 });
        }

        if (!finalRecipientId) {
            return NextResponse.json({ error: 'Missing recipient_id' }, { status: 400 });
        }

        // Build message payload
        const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${finalPageToken}`;
        let body: any;

        if (attachment_url) {
            // Send attachment (image, file, video, audio)
            body = {
                recipient: { id: finalRecipientId },
                message: {
                    attachment: {
                        type: attachment_type || 'file',
                        payload: {
                            url: attachment_url,
                            is_reusable: true
                        }
                    }
                }
            };
        } else {
            // Send text message
            body = {
                recipient: { id: finalRecipientId },
                message: { text: message }
            };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        let data = await res.json();

        // Fallback for Error 10 (Outside 24-hour standard messaging window)
        // We retry using the HUMAN_AGENT tag which extends the window to 7 days for humans
        if (data.error && data.error.code === 10) {
            console.log('[Facebook Reply] Error 10 detected. Retrying with HUMAN_AGENT tag...');
            body.messaging_type = 'MESSAGE_TAG';
            body.tag = 'HUMAN_AGENT';
            
            const fallbackRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const fallbackData = await fallbackRes.json();
            
            if (fallbackData.error) {
                return NextResponse.json({ error: fallbackData.error.message }, { status: 400 });
            }
            // Success with fallback
            data = fallbackData;
        } else if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        // Update conversation snippet
        if (finalConversationId) {
            const snippet = attachment_url
                ? `[${attachment_type === 'image' ? 'Hình ảnh' : 'Tệp tin'}]`
                : message;

            await supabase
                .from('social_conversations')
                .update({
                    snippet,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', finalConversationId);
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Reply API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
