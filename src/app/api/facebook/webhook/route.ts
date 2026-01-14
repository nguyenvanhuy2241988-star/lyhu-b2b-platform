import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

// Verification Token (Should come from Env)
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'lyhu_verify_token_123';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return new NextResponse(challenge, { status: 200 });
    } else {
        return new NextResponse('Forbidden', { status: 403 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (body.object === 'page') {
            const supabase = createClient();

            for (const entry of body.entry) {
                const webhook_event = entry.messaging ? entry.messaging[0] : null;

                // Handle Messaging (Inbox)
                if (webhook_event && webhook_event.message) {
                    const sender_psid = webhook_event.sender.id;
                    const message_text = webhook_event.message.text;
                    // TODO: Handle Attachments
                    // TODO: Upsert Conversation & Insert Message
                    console.log('Received Message:', message_text, 'From:', sender_psid);

                    // Logic to save to DB goes here.
                    // For now we just log it.
                    // In real implementation:
                    // 1. Find conversation with sender_psid
                    // 2. If not exists, create new
                    // 3. Insert message
                    // 4. Update conversation snippet/time
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
