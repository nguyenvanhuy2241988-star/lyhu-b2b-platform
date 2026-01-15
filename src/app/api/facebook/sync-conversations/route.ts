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
        // Support searching by internal UUID (pageData.id) or Facebook Page ID (pageData.page_id)
        let query = supabase.from('facebook_pages').select('access_token, id, page_id');

        // Simple regex/length check: FB IDs are numeric strings (usually 10+ digits), UUIDs contain dashes
        if (page_id.includes('-')) {
            query = query.eq('id', page_id);
        } else {
            query = query.eq('page_id', page_id);
        }

        const { data: pageData } = await query.single();

        if (!pageData || !pageData.access_token) {
            return NextResponse.json({ error: 'Page not found or no access token' }, { status: 404 });
        }

        // 2. Fetch Conversations from Facebook
        const fields = 'id,updated_time,messages{message,created_time,from,to},senders,snippet_is_read_only,unread_count,snippet,link';
        const response = await fetch(`https://graph.facebook.com/v19.0/me/conversations?fields=${fields}&limit=${limit}&access_token=${pageData.access_token}`);
        const data = await response.json();

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        const conversations = data.data || [];
        let count = 0;

        // 3. Sync to Database
        for (const conv of conversations) {
            // Extract customer info
            // Facebook API 'senders' usually contains the customer user.
            const customer = conv.senders?.data[0];
            const customerName = customer?.name || 'Facebook User';
            const customerId = customer?.id || conv.id; // Use conv ID if sender ID missing? No, sender ID is user ID.

            // Note: Scoped ID for user.
            // External ID for conversation is conv.id (t_...)

            const { data: insertedConv, error: insertError } = await supabase
                .from('social_conversations')
                .upsert({
                    platform: 'facebook',
                    external_id: conv.id, // Conversation ID (t_123...)
                    page_id: pageData.id,
                    customer_name: customerName,
                    customer_avatar: `https://graph.facebook.com/${customer?.id}/picture?type=normal`, // Need scoped ID
                    snippet: conv.snippet,
                    unread_count: conv.unread_count,
                    last_message_at: conv.updated_time,
                    // TODO: updated_at, etc.
                }, { onConflict: 'platform, external_id' })
                .select()
                .single();

            if (insertedConv) {
                count++;
                // Sync Messages? Maybe separate process or only last message?
                // For Deep Sync, we might want messages.
                // But fields=messages only gives simplified list.
                // Let's rely on webhook for new messages, and just sync conversation metadata here.
                // Or loop `conv.messages.data` if available.
                if (conv.messages && conv.messages.data) {
                    const messages = conv.messages.data.map((m: any) => ({
                        conversation_id: insertedConv.id,
                        external_id: m.id,
                        content: m.message,
                        sender_id: m.from?.id,
                        sender_name: m.from?.name,
                        created_at: m.created_time,
                        is_from_page: m.from?.id === page_id // Check if sender is page
                    }));

                    if (messages.length > 0) {
                        await supabase.from('social_messages').upsert(messages, { onConflict: 'external_id' });
                    }
                }
            }
        }

        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
