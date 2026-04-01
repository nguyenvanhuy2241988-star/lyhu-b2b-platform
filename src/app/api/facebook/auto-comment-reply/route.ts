import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Cron Job: Auto-scan comments on all connected pages
 * Runs every 3 minutes to find new comments and:
 * 1. Reply "Anh/Chị check Inbox ạ ❤️"
 * 2. Send private inbox message to commenter
 */
export async function GET() {
    const startTime = Date.now();
    console.log('[Comment Cron] Starting auto-scan...');

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Get all connected pages
        const { data: pages, error } = await supabase
            .from('facebook_pages')
            .select('id, page_id, name, access_token, chatbot_config')
            .eq('is_connected', true);

        if (error || !pages?.length) {
            return NextResponse.json({ success: true, message: 'No connected pages' });
        }

        let totalProcessed = 0;
        let totalReplied = 0;
        let totalInboxed = 0;

        for (const page of pages) {
            if (!page.access_token) continue;

            const config = (page.chatbot_config as any) || {};
            // Default ON: auto reply + inbox for comments
            const autoCommentEnabled = config.auto_comment_reply_enabled !== false;
            if (!autoCommentEnabled) continue;

            const commentReplyText = config.auto_comment_reply_text || 'Anh/Chị check Inbox ạ ❤️';
            const inboxEnabled = config.auto_comment_inbox_enabled !== false;
            const inboxText = config.auto_comment_inbox_text ||
                'Chào bạn! 👋\nCảm ơn bạn đã quan tâm đến sản phẩm LYHU!\nBạn vui lòng cho mình xin SĐT để tư vấn chi tiết hơn nhé ❤️';

            // Fetch both ads_posts and regular posts
            const allPosts: { id: string }[] = [];
            const seenPostIds = new Set<string>();

            // 1. Ads posts (includes dark posts)
            try {
                const adsRes = await fetch(
                    `https://graph.facebook.com/v19.0/${page.page_id}/ads_posts?fields=id&limit=10&access_token=${page.access_token}`
                );
                const adsData = await adsRes.json();
                for (const p of adsData.data || []) {
                    if (!seenPostIds.has(p.id)) { seenPostIds.add(p.id); allPosts.push({ id: p.id }); }
                }
            } catch (e) { }

            // 2. Regular posts
            try {
                const postsRes = await fetch(
                    `https://graph.facebook.com/v19.0/${page.page_id}/posts?fields=id&limit=5&access_token=${page.access_token}`
                );
                const postsData = await postsRes.json();
                for (const p of postsData.data || []) {
                    if (!seenPostIds.has(p.id)) { seenPostIds.add(p.id); allPosts.push({ id: p.id }); }
                }
            } catch (e) { }

            // Scan comments for each post
            for (const post of allPosts) {
                try {
                    const commentsRes = await fetch(
                        `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from,is_hidden,created_time&limit=25&order=reverse_chronological&access_token=${page.access_token}`
                    );
                    const commentsData = await commentsRes.json();
                    if (!commentsData.data) continue;

                    // Only process recent comments (last 10 minutes to avoid re-processing old ones)
                    const tenMinAgo = Date.now() - 10 * 60 * 1000;

                    for (const comment of commentsData.data) {
                        // Skip page's own comments
                        if (comment.from?.id === page.page_id) continue;
                        if (comment.is_hidden) continue;
                        if (!comment.from?.id) continue;

                        // Skip old comments
                        const commentTime = new Date(comment.created_time).getTime();
                        if (commentTime < tenMinAgo) continue;

                        totalProcessed++;

                        // Check if page already replied
                        const repliesRes = await fetch(
                            `https://graph.facebook.com/v19.0/${comment.id}/comments?fields=from&limit=5&access_token=${page.access_token}`
                        );
                        const repliesData = await repliesRes.json();
                        const alreadyReplied = repliesData.data?.some((r: any) => r.from?.id === page.page_id);

                        if (alreadyReplied) continue;

                        // 1. Reply to comment
                        try {
                            await fetch(`https://graph.facebook.com/v19.0/${comment.id}/comments?access_token=${page.access_token}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ message: commentReplyText })
                            });
                            totalReplied++;
                            console.log(`[Comment Cron] Replied to ${comment.from?.name}: "${commentReplyText}"`);
                        } catch (e) {
                            console.error('[Comment Cron] Reply error:', e);
                        }

                        // 2. Send private inbox message
                        if (inboxEnabled) {
                            try {
                                // Try Private Replies API first
                                const privateRes = await fetch(
                                    `https://graph.facebook.com/v19.0/${comment.id}/private_replies?access_token=${page.access_token}`,
                                    {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ message: inboxText })
                                    }
                                );
                                const privateData = await privateRes.json();

                                if (privateData.error) {
                                    // Fallback: send via Messenger (only works if user messaged before)
                                    await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${page.access_token}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            recipient: { id: comment.from.id },
                                            message: { text: inboxText }
                                        })
                                    });
                                }
                                totalInboxed++;
                                console.log(`[Comment Cron] Inbox sent to ${comment.from?.name}`);
                            } catch (e) {
                                console.error('[Comment Cron] Inbox error:', e);
                            }
                        }

                        // Rate limiting: small delay between replies
                        await new Promise(r => setTimeout(r, 500));
                    }
                } catch (e) {
                    console.error(`[Comment Cron] Error scanning post ${post.id}:`, e);
                }
            }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[Comment Cron] Done in ${elapsed}ms. Processed: ${totalProcessed}, Replied: ${totalReplied}, Inboxed: ${totalInboxed}`);

        return NextResponse.json({
            success: true,
            processed: totalProcessed,
            replied: totalReplied,
            inboxed: totalInboxed,
            elapsed_ms: elapsed
        });

    } catch (error: any) {
        console.error('[Comment Cron] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
