import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { conversation_id, message, page_token, recipient_id } = await request.json();

        if (!message || (!conversation_id && !recipient_id)) {
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

        // FIX #6: If no page_token provided, lookup from DB
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

        // Send to Facebook
        const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${finalPageToken}`;
        const body = {
            recipient: { id: finalRecipientId },
            message: { text: message }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        // Note: Don't insert message here — echo webhook will save it to avoid duplicates
        // Just update conversation snippet
        if (finalConversationId) {

            // Update conversation snippet
            await supabase
                .from('social_conversations')
                .update({
                    snippet: message,
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
