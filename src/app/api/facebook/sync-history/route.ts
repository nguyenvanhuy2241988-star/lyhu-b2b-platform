import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get optional page_id filter from query
        const url = new URL(req.url);
        const filterPageId = url.searchParams.get('page_id');

        // Get all pages (or specific page)
        let query = supabase.from('facebook_pages').select('id, page_id, page_name, access_token');
        if (filterPageId) {
            query = query.eq('page_id', filterPageId);
        }
        const { data: pages, error: pagesErr } = await query;

        if (pagesErr || !pages?.length) {
            return NextResponse.json({ error: 'No pages found', details: pagesErr }, { status: 400 });
        }

        const results: any[] = [];

        for (const page of pages) {
            if (!page.access_token) {
                results.push({ page: page.page_name, error: 'No access token' });
                continue;
            }

            try {
                // Fetch conversations from Facebook
                const convUrl = `https://graph.facebook.com/v21.0/${page.page_id}/conversations?fields=participants,updated_time,snippet&limit=50&access_token=${page.access_token}`;
                const convRes = await fetch(convUrl);
                const convData = await convRes.json();

                if (convData.error) {
                    results.push({ page: page.page_name, error: convData.error.message });
                    continue;
                }

                const conversations = convData.data || [];
                let syncedConvs = 0;
                let syncedMsgs = 0;

                for (const fbConv of conversations) {
                    // Find customer participant (not the page)
                    const customer = fbConv.participants?.data?.find(
                        (p: any) => p.id !== page.page_id
                    );
                    const customerName = customer?.name || 'Facebook User';
                    const customerId = customer?.id || '';

                    if (!customerId) continue;

                    // Upsert conversation
                    const { data: convRecord } = await supabase
                        .from('social_conversations')
                        .upsert({
                            platform: 'facebook',
                            external_id: customerId,
                            page_id: page.id,
                            customer_name: customerName,
                            customer_avatar: `https://graph.facebook.com/${customerId}/picture?type=normal&access_token=${page.access_token}`,
                            snippet: fbConv.snippet || '',
                            last_message_at: fbConv.updated_time || new Date().toISOString(),
                            unread_count: 0,
                        }, { onConflict: 'platform,external_id' })
                        .select('id, customer_name')
                        .single();

                    if (!convRecord) continue;
                    syncedConvs++;

                    // Fetch messages for this conversation
                    const msgUrl = `https://graph.facebook.com/v21.0/${fbConv.id}/messages?fields=message,from,created_time&limit=100&access_token=${page.access_token}`;
                    const msgRes = await fetch(msgUrl);
                    const msgData = await msgRes.json();

                    if (msgData.data) {
                        for (const msg of msgData.data) {
                            if (!msg.message) continue;

                            const isFromPage = msg.from?.id === page.page_id;

                            await supabase.from('social_messages').upsert({
                                conversation_id: convRecord.id,
                                external_id: msg.id,
                                content: msg.message,
                                sender_id: msg.from?.id || 'unknown',
                                sender_name: msg.from?.name || (isFromPage ? 'Page' : customerName),
                                is_from_page: isFromPage,
                                created_at: msg.created_time || new Date().toISOString(),
                            }, { onConflict: 'external_id' });

                            syncedMsgs++;
                        }
                    }
                }

                results.push({
                    page: page.page_name,
                    conversations: syncedConvs,
                    messages: syncedMsgs,
                    success: true,
                });
            } catch (e: any) {
                results.push({ page: page.page_name, error: e.message });
            }
        }

        return NextResponse.json({ results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Allow GET for easy browser testing
export async function GET(req: Request) {
    return POST(req);
}
