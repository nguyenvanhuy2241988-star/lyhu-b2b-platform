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

        // Simple check: UUIDs contain dashes, FB IDs are numeric
        if (page_id.includes('-')) {
            query = query.eq('id', page_id);
        } else {
            query = query.eq('page_id', page_id);
        }

        const { data: pageData } = await query.single();

        if (!pageData || !pageData.access_token) {
            return NextResponse.json({ error: 'Page not found or no access token' }, { status: 404 });
        }

        // FIX #3: Keep actual FB page_id for is_from_page comparison
        const fbPageId = pageData.page_id;

        // 2. Fetch Conversations from Facebook (with pagination - FIX #4)
        const fields = 'id,updated_time,messages{message,created_time,from,to},senders,snippet_is_read_only,unread_count,snippet,link';
        let nextUrl: string | null = `https://graph.facebook.com/v19.0/me/conversations?fields=${fields}&limit=${limit}&access_token=${pageData.access_token}`;
        let allConversations: any[] = [];
        let pageCount = 0;
        const MAX_PAGES = 5; // Safety limit: max 250 conversations

        while (nextUrl && pageCount < MAX_PAGES) {
            const response: Response = await fetch(nextUrl);
            const data: any = await response.json();

            if (data.error) {
                return NextResponse.json({ error: data.error.message }, { status: 400 });
            }

            if (data.data) {
                allConversations = [...allConversations, ...data.data];
            }

            // FIX #4: Follow pagination
            nextUrl = data.paging?.next || null;
            pageCount++;
        }

        let count = 0;

        // 3. Sync to Database
        for (const conv of allConversations) {
            // Find the actual customer (not the page) from senders
            const senders = conv.senders?.data || [];
            const customer = senders.find((s: any) => s.id !== fbPageId) || senders[0];
            const customerName = customer?.name || 'Facebook User';
            const customerId = customer?.id;

            if (!customerId) {
                console.warn("Skipping conversation without sender ID:", conv.id);
                continue;
            }

            const { data: insertedConv, error: insertError } = await supabase
                .from('social_conversations')
                .upsert({
                    platform: 'facebook',
                    external_id: customerId,
                    page_id: pageData.id,
                    customer_name: customerName,
                    customer_avatar: `https://graph.facebook.com/${customerId}/picture?type=normal`,
                    snippet: conv.snippet,
                    unread_count: conv.unread_count,
                    last_message_at: conv.updated_time,
                    fb_thread_id: conv.id, // Store Facebook thread ID for Business Suite linking
                }, { onConflict: 'platform, external_id' })
                .select()
                .single();

            if (insertedConv) {
                count++;
                if (conv.messages && conv.messages.data) {
                    const messages = conv.messages.data.map((m: any) => ({
                        conversation_id: insertedConv.id,
                        external_id: m.id,
                        content: m.message,
                        sender_id: m.from?.id,
                        sender_name: m.from?.name,
                        created_at: m.created_time,
                        // FIX #3: Compare with actual FB page ID, not internal UUID
                        is_from_page: m.from?.id === fbPageId
                    }));

                    if (messages.length > 0) {
                        await supabase.from('social_messages').upsert(messages, { onConflict: 'external_id' });
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            count,
            message: `Đồng bộ thành công ${count} hội thoại`
        });
    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
