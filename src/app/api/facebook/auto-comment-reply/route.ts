import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;
const VERSION = 'v10-timeout-fix';

/**
 * Cron Job: Auto-scan comments on all connected pages
 * Runs every 3 minutes to find new comments and:
 * 1. Reply "Anh/Chị check Inbox ạ ❤️"
 * 2. Send private inbox message to commenter
 * 
 * Dedup: Uses DB table `comment_auto_replies` to track replied comments
 * Debug: Add ?clean=1 to clear DB before scanning
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();
    const cleanMode = request.nextUrl.searchParams.get('clean') === '1';
    console.log(`[Comment Cron] Starting auto-scan... (clean=${cleanMode})`);

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

        // Clean mode: delete all dedup records for fresh test
        if (cleanMode) {
            await supabase.from('comment_auto_replies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            console.log('[Comment Cron] 🧹 Clean mode: cleared all dedup records');
        }

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

            // Fetch page posts (includes bài quảng cáo đã promoted) - limit 10
            const allPosts: { id: string }[] = [];
            const seenPostIds = new Set<string>();

            try {
                const postsRes = await fetch(
                    `https://graph.facebook.com/v19.0/${page.page_id}/posts?fields=id&limit=10&access_token=${page.access_token}`
                );
                const postsData = await postsRes.json();
                for (const p of postsData.data || []) {
                    if (!seenPostIds.has(p.id)) { seenPostIds.add(p.id); allPosts.push({ id: p.id }); }
                }
            } catch (e) { }

            const pageDebug: any = { page: page.name, page_id: page.page_id, posts_found: allPosts.length, posts: [] as any[], reply_errors: [] as any[] };

            // Scan comments for each post (with timeout guard)
            for (const post of allPosts) {
                // Timeout guard: stop scanning if approaching 50s limit
                if (Date.now() - startTime > 45000) {
                    console.log(`[Comment Cron] ⏱️ Approaching timeout, stopping scan for ${page.name}`);
                    break;
                }
                try {
                    const commentsRes = await fetch(
                        `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from,is_hidden,created_time&limit=25&order=reverse_chronological&access_token=${page.access_token}`
                    );
                    const commentsData = await commentsRes.json();
                    const postDebug: any = {
                        post_id: post.id,
                        comments_total: commentsData.data?.length || 0,
                        error: commentsData.error?.message || null,
                        filtered_page_own: 0,
                        filtered_hidden: 0,
                        passed_filter: 0,
                        sample_comments: (commentsData.data || []).slice(0, 5).map((c: any) => ({
                            id: c.id,
                            from: c.from?.name || 'NO_FROM',
                            from_id: c.from?.id || 'NO_ID',
                            message: (c.message || '').substring(0, 50),
                            is_hidden: c.is_hidden,
                            is_page: c.from?.id === page.page_id
                        }))
                    };
                    pageDebug.posts.push(postDebug);
                    if (!commentsData.data) continue;

                    for (const comment of commentsData.data) {
                        // Skip page's own comments (only if from.id is available)
                        if (comment.from?.id && comment.from.id === page.page_id) {
                            postDebug.filtered_page_own++;
                            continue;
                        }
                        if (comment.is_hidden) {
                            postDebug.filtered_hidden++;
                            continue;
                        }
                        // NOTE: Do NOT skip comments without from.id - we can still reply to them
                        postDebug.passed_filter++;
                        totalProcessed++;

                        // ===== DB DEDUP CHECK =====
                        // Only skip if we already SUCCESSFULLY replied
                        const { data: existing } = await supabase
                            .from('comment_auto_replies')
                            .select('id, replied')
                            .eq('comment_id', comment.id)
                            .maybeSingle();

                        if (existing?.replied) {
                            totalSkipped++;
                            continue; // Already successfully replied, skip
                        }

                        // NOTE: Removed FB API double-check - DB dedup is sufficient
                        // and the FB check was incorrectly skipping comments

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
                                const errMsg = replyData.error?.message || 'Unknown error';
                                const errCode = replyData.error?.code || 0;
                                console.error(`[Comment Cron] ❌ Reply failed:`, errMsg);
                                pageDebug.reply_errors.push({
                                    comment_id: comment.id,
                                    comment_msg: (comment.message || '').substring(0, 50),
                                    from: comment.from?.name || 'NO_FROM',
                                    error: errMsg,
                                    error_code: errCode,
                                    error_subcode: replyData.error?.error_subcode || 0,
                                    full_response: JSON.stringify(replyData).substring(0, 200)
                                });
                            }
                        } catch (e) {
                            console.error('[Comment Cron] Reply error:', e);
                        }

                        // ===== 2. SEND PRIVATE INBOX =====
                        let inboxSuccess = false;
                        if (inboxEnabled) {
                            try {
                                // Try Private Replies API first (works without from.id)
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
                                    console.log(`[Comment Cron] Private reply failed (${privateData.error?.message})`);
                                    // Fallback: send via Messenger API (only works if user messaged page before AND we have from.id)
                                    if (comment.from?.id) {
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
                                    }
                                } else {
                                    inboxSuccess = true;
                                }

                                if (inboxSuccess) {
                                    totalInboxed++;
                                    console.log(`[Comment Cron] 📩 Inbox sent to ${comment.from?.name || 'unknown'}`);
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
                            commenter_id: comment.from?.id || '',
                            commenter_name: comment.from?.name || '',
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
            version: VERSION,
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
