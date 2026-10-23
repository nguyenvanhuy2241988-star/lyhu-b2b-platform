export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST { conversation_id } → { url }
 * Lấy link mở ĐÚNG cuộc trò chuyện trên Facebook/Business Suite (trường `link` của Graph API),
 * lưu vào social_conversations.customer_profile_url để lần sau dùng ngay.
 * Meta không cấp link trang cá nhân của khách qua API; từ cuộc trò chuyện bấm "Xem trang cá nhân".
 */
export async function POST(request: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );
        const jwt = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { data: { user } } = await supabase.auth.getUser(jwt);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { conversation_id } = await request.json().catch(() => ({}));
        if (!conversation_id) return NextResponse.json({ error: 'Thiếu conversation_id' }, { status: 400 });

        const { data: conv } = await supabase
            .from('social_conversations')
            .select('id, page_id, external_id, fb_thread_id, customer_profile_url')
            .eq('id', conversation_id)
            .single();
        if (!conv) return NextResponse.json({ error: 'Không tìm thấy hội thoại' }, { status: 404 });

        const toUrl = (l: string) => (l.startsWith('http') ? l : `https://www.facebook.com${l}`);
        if (conv.customer_profile_url) return NextResponse.json({ url: toUrl(conv.customer_profile_url) });

        const { data: page } = await supabase
            .from('facebook_pages')
            .select('page_id, access_token')
            .eq('id', conv.page_id)
            .single();
        const fallback = page?.page_id
            ? `https://business.facebook.com/latest/inbox/all?asset_id=${page.page_id}`
            : 'https://business.facebook.com/latest/inbox/all';
        if (!page?.access_token) return NextResponse.json({ url: fallback, exact: false });

        // Tìm thread: ưu tiên fb_thread_id, nếu chưa có thì tra theo người dùng
        let link: string | null = null;
        let threadId: string | null = conv.fb_thread_id || null;
        try {
            if (threadId) {
                const r = await fetch(`https://graph.facebook.com/v21.0/${threadId}?fields=link&access_token=${page.access_token}`);
                link = (await r.json())?.link || null;
            }
            if (!link && conv.external_id) {
                const r = await fetch(`https://graph.facebook.com/v21.0/${page.page_id}/conversations?user_id=${conv.external_id}&fields=id,link&access_token=${page.access_token}`);
                const d = (await r.json())?.data?.[0];
                link = d?.link || null;
                threadId = threadId || d?.id || null;
            }
        } catch (e) {
            console.error('[conversation-link] Graph error:', e);
        }

        if (!link) return NextResponse.json({ url: fallback, exact: false });

        await supabase
            .from('social_conversations')
            .update({ customer_profile_url: link, ...(threadId && !conv.fb_thread_id ? { fb_thread_id: threadId } : {}) })
            .eq('id', conv.id);

        return NextResponse.json({ url: toUrl(link), exact: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
