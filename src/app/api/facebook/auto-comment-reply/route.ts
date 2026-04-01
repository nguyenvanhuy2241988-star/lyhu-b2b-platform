import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;

/**
 * Cron Job: Auto-scan comments on all connected pages
 * Runs every 3 minutes to find new comments and:
 * 1. Reply "Anh/Chị check Inbox ạ ❤️"
 * 2. Send private inbox message to commenter
 * 
 * Dedup: Uses DB table `comment_auto_replies` to track replied comments
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
        let totalSkipped = 0;
        const debug: any[] = [];

        for (const page of pages) {
            if (!page.access_token) continue;

            const config = (page.chatbot_config as any) || {};
            const autoCommentEnabled = config.auto_comment_reply_enabled !== false;
            if (!autoCommentEnabled) continue;

            const commentReplyText = config.auto_comment_reply_text || 'Anh/Chị check Inbox ạ ❤️';
            const inboxEnabled = config.auto_comment_inbox_enabled !== false;
            const inboxText = config.auto_comment_inbox_text ||
                'Chào bạn! 👋\nCảm ơn bạn đã quan tâm đến sản phẩm LYHU!\nBạn vui lòng cho mình xin SĐT để tư vấn chi tiết hơn nhé ❤️';

            // Fetch both ads_posts and regular posts
            const allPosts: { id: string }[] = [];
            const seenPostIds = new Set<string>();

            // 1. Ads posts (includes dark posts from ads)
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

            const pageDebug: any = { page: page.name, page_id: page.page_id, posts_found: allPosts.length, posts: [] as any[] };

            // Scan comments for each post
            for (const post of allPosts) {
                try {
                    const commentsRes = await fetch(
                        `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from,is_hidden,created_time&limit=50&order=reverse_chronological&access_token=${page.access_token}`
                    );
                    const commentsData = await commentsRes.json();
                    const postDebug: any = {
                        post_id: post.id,
                        comments_total: commentsData.data?.length || 0,
                        error: commentsData.error?.message || null,
                        sample_comments: (commentsData.data || []).slice(0, 3).map((c: any) => ({
                            id: c.id,
                            from: c.from?.name || 'NO_FROM',
                            from_id: c.from?.id || 'NO_ID',
                            message: (c.message || '').substring(0, 40),
                            is_hidden: c.is_hidden,
                            is_page: c.from?.id === page.page_id
                        }))
                    };
                    pageDebug.posts.push(postDebug);
                    if (!commentsData.data) continue;

                    for (const comment of commentsData.data) {
                        // Skip page's own comments
                        if (comment.from?.id === page.page_id) continue;
                        if (comment.is_hidden) continue;
                        if (!comment.from?.id) continue;

                        totalProcessed++;

                        // ===== DB DEDUP CHECK =====
                        // Check if we already processed this comment
                        const { data: existing } = await supabase
                            .from('comment_auto_replies')
                            .select('id')
                            .eq('comment_id', comment.id)
                            .maybeSingle();

                        if (existing) {
                            totalSkipped++;
                            continue; // Already processed, skip
                        }

                        // Also double-check via Facebook API (belt & suspenders)
                        let alreadyRepliedOnFB = false;
                        try {
                            const repliesRes = await fetch(
                                `https://graph.facebook.com/v19.0/${comment.id}/comments?fields=from&limit=5&access_token=${page.access_token}`
                            );
                            const repliesData = await repliesRes.json();
                            alreadyRepliedOnFB = repliesData.data?.some((r: any) => r.from?.id === page.page_id);
                        } catch (e) { }

                        if (alreadyRepliedOnFB) {
                            // Save to DB so we skip next time
                            await supabase.from('comment_auto_replies').upsert({
                                comment_id: comment.id,
                                post_id: post.id,
                                page_id: page.id,
                                commenter_id: comment.from.id,
                                commenter_name: comment.from.name || '',
                                comment_text: comment.message || '',
                                replied: true,
                                inboxed: false,
                                created_at: new Date().toISOString()
                            }, { onConflict: 'comment_id' });
                            totalSkipped++;
                            continue;
                        }

                        // ===== 1. REPLY TO COMMENT =====
                        let replySuccess = false;
                        try {
                            const replyRes = await fetch(`https://graph.facebook.com/v19.0/${comment.id}/comments?access_token=${page.access_token}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ message: commentReplyText })
                            });
                            const replyData = await replyRes.json();
                            replySuccess = !replyData.error;
                            if (replySuccess) {
                                totalReplied++;
                                console.log(`[Comment Cron] ✅ Replied to ${comment.from?.name}: "${comment.message?.substring(0, 30)}"`);
                            } else {
                                console.error(`[Comment Cron] ❌ Reply failed:`, replyData.error?.message);
                            }
                        } catch (e) {
                            console.error('[Comment Cron] Reply error:', e);
                        }

                        // ===== 2. SEND PRIVATE INBOX =====
                        let inboxSuccess = false;
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
                                    console.log(`[Comment Cron] Private reply failed (${privateData.error?.message}), trying Messenger fallback...`);
                                    // Fallback: send via Messenger API (only works if user messaged page before)
                                    const msgRes = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${page.access_token}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            recipient: { id: comment.from.id },
                                            message: { text: inboxText }
                                        })
                                    });
                                    const msgData = await msgRes.json();
                                    inboxSuccess = !msgData.error;
                                } else {
                                    inboxSuccess = true;
                                }

                                if (inboxSuccess) {
                                    totalInboxed++;
                                    console.log(`[Comment Cron] 📩 Inbox sent to ${comment.from?.name}`);
                                }
                            } catch (e) {
                                console.error('[Comment Cron] Inbox error:', e);
                            }
                        }

                        // ===== 3. SAVE TO DB (DEDUP LOG) =====
                        await supabase.from('comment_auto_replies').upsert({
                            comment_id: comment.id,
                            post_id: post.id,
                            page_id: page.id,
                            commenter_id: comment.from.id,
                            commenter_name: comment.from.name || '',
                            comment_text: comment.message || '',
                            replied: replySuccess,
                            inboxed: inboxSuccess,
                            created_at: new Date().toISOString()
                        }, { onConflict: 'comment_id' });

                        // Rate limiting: delay between replies to avoid FB throttle
                        await new Promise(r => setTimeout(r, 800));
                    }
                } catch (e) {
                    console.error(`[Comment Cron] Error scanning post ${post.id}:`, e);
                }
            }

            debug.push(pageDebug);
        }

        const elapsed = Date.now() - startTime;
        console.log(`[Comment Cron] Done in ${elapsed}ms. Processed: ${totalProcessed}, Replied: ${totalReplied}, Inboxed: ${totalInboxed}, Skipped: ${totalSkipped}`);

        return NextResponse.json({
            success: true,
            processed: totalProcessed,
            replied: totalReplied,
            inboxed: totalInboxed,
            skipped: totalSkipped,
            elapsed_ms: elapsed,
            debug
        });

    } catch (error: any) {
        console.error('[Comment Cron] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
