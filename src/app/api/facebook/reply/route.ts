import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const { conversation_id, message, page_token, recipient_id } = await request.json();

        if (!message || (!conversation_id && !recipient_id)) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // If we have conversation_id, look up recipient_id (PSID)
        let finalRecipientId = recipient_id;

        // TODO: In real app, we should fetch Page Access Token from DB if not provided
        // const supabase = createClient();
        // ... fetch page_token ...

        if (!page_token) {
            return NextResponse.json({ error: 'Missing page_token' }, { status: 400 });
        }

        // Send to Facebook
        const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${page_token}`;
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

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Reply API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
