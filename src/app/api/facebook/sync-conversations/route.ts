import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const cookieStore = cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // Handle non-Server Action context
                    }
                },
                remove(name: string, options: any) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // Handle non-Server Action context
                    }
                },
            },
        }
    );

    // 1. Check Auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { page_id, limit = 20 } = await req.json();

        if (!page_id) {
            return NextResponse.json({ error: 'Missing page_id' }, { status: 400 });
        }

        // 2. Get Page Token
        const { data: page, error: pageError } = await supabase
            .from('facebook_pages')
            .select('access_token, page_id') // page_id column is the FB ID
            .eq('id', page_id) // Match ID (UUID) or page_id (FB ID)? 
            // Input page_id is likely UUID from our DB if selected from dropdown. 
            // Dropdown in Inbox sends: p.id (UUID).
            .single();

        if (pageError || !page || !page.access_token) {
            return NextResponse.json({ error: 'Page not connected or invalid' }, { status: 404 });
        }

        const fbPageId = page.page_id;
        const accessToken = page.access_token;

        // 3. Fetch Conversations from Facebook
        // Fields: id, updated_time, snippet, unread_count, participants
        // Expand messages: messages.limit(20){id,message,created_time,from,attachments}
        const fields = 'id,updated_time,snippet,unread_count,participants,messages.limit(20){id,message,created_time,from,attachments}';
        const fbUrl = `https://graph.facebook.com/v19.0/${fbPageId}/conversations?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();

        if (fbData.error) {
            console.error("FB Sync Error:", fbData.error);
            return NextResponse.json({ error: fbData.error.message }, { status: 400 });
        }

        const conversations = fbData.data || [];
        let newConvCount = 0;
        let newMsgCount = 0;

        for (const conv of conversations) {
            // 4. Upsert Conversation
            const participant = conv.participants?.data?.[0]; // Usually the customer
            const customerName = participant?.name || 'Facebook User';
            const customerId = participant?.id; // PSID

            // Note: external_id matches Thread ID (conv.id)
            const { data: savedConv, error: saveConvError } = await supabase
                .from('social_conversations')
                .upsert({
                    platform: 'facebook',
                    external_id: conv.id,
                    page_id: page_id, // Our DB UUID
                    customer_name: customerName,
                    snippet: conv.snippet,
                    unread_count: conv.unread_count || 0,
                    updated_at: conv.updated_time,
                    last_message_at: conv.updated_time
                }, { onConflict: 'platform, external_id' })
                .select()
                .single();

            if (saveConvError) {
                console.error("Save Conv Error:", saveConvError);
                continue;
            }

            if (savedConv) {
                newConvCount++;
                const convId = savedConv.id;

                // 5. Insert Messages
                const messages = conv.messages?.data || [];
                const messagesToInsert = messages.map((msg: any) => ({
                    conversation_id: convId,
                    external_id: msg.id,
                    content: msg.message || '',
                    sender_id: msg.from?.id,
                    sender_name: msg.from?.name,
                    is_from_page: msg.from?.id === fbPageId, // If sender is Page
                    created_at: msg.created_time,
                    attachments: msg.attachments?.data || null
                }));

                if (messagesToInsert.length > 0) {
                    // Use upsert or insert with ignore
                    const { error: msgError } = await supabase
                        .from('social_messages')
                        .upsert(messagesToInsert, { onConflict: 'external_id', ignoreDuplicates: true });

                    if (!msgError) newMsgCount += messagesToInsert.length;
                    else console.error("Save Msg Error:", msgError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${newConvCount} conversations and ${newMsgCount} messages`,
            stats: { conversations: newConvCount, messages: newMsgCount }
        });

    } catch (error: any) {
        console.error("Sync Exception:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
