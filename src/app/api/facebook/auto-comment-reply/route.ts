import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;
const VERSION = 'v13-video-fix';

const MAX_COMMENT_AGE_HOURS = 24;

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    const cleanMode = request.nextUrl.searchParams.get('clean') === '1';

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        const { data: pages, error } = await supabase
            .from('facebook_pages')
            .select('id, page_id, name, access_token, chatbot_config')
            .eq('is_connected', true);

        if (cleanMode) {
            await supabase.from('comment_auto_replies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        if (error || !pages?.length) {
            return NextResponse.json({ version: VERSION, success: true, message: 'No connected pages' });
        }

        let totalProcessed = 0;
        let totalReplied = 0;
        let totalInboxed = 0;
        let totalSkipped = 0;
        let totalTooOld = 0;
        let totalAlreadyReplied = 0;
        const summary: any[] = [];
        const cutoffTime = new Date(Date.now() - MAX_COMMENT_AGE_HOURS * 60 * 60 * 1000);

        for (const page of pages) {
            if (Date.now() - startTime > 48000) break;
            if (!page.access_token) continue;

            const config = (page.chatbot_config as any) || {};
            if (config.auto_comment_reply_enabled === false) continue;

            const commentReplyText = config.auto_comment_reply_text || 'Anh/Chị check Inbox ạ ❤️';
            const inboxEnabled = config.auto_comment_inbox_enabled !== false;
            const inboxText = config.auto_comment_inbox_text ||
                'Chào bạn! 👋\nCảm ơn bạn đã quan tâm đến sản phẩm LYHU!\nBạn vui lòng cho mình xin SĐT để tư vấn chi tiết hơn nhé ❤️';

            const allPosts: { id: string }[] = [];
            const monitoredPostIds: string[] = config.auto_comment_post_ids || [];

            if (monitoredPostIds.length > 0) {
                for (const postIdOrUrl of monitoredPostIds) {
                    let resolvedId = postIdOrUrl;

                    // Extract numeric ID from URL
                    if (postIdOrUrl.includes('facebook.com') || postIdOrUrl.startsWith('http')) {
                        const numericMatch = postIdOrUrl.match(/\/(\d{10,})/);
                        if (numericMatch) resolvedId = numericMatch[1];
                    }

                    // For pure numeric IDs (likely video IDs), try page_id_numericId format
                    if (/^\d+$/.test(resolvedId)) {
                        const pagePostId = `${page.page_id}_${resolvedId}`;
                        try {
                            const checkRes = await fetch(
                                `https://graph.facebook.com/v19.0/${pagePostId}?fields=id&access_token=${page.access_token}`
                            );
                            const checkData = await checkRes.json();
                            if (!checkData.error) {
                                resolvedId = pagePostId; // page_id_videoId format works!
                            }
                        } catch (e) { }
                    }

                    allPosts.push({ id: resolvedId });
                }
            } else {
                try {
                    const postsRes = await fetch(
                        `https://graph.facebook.com/v19.0/${page.page_id}/posts?fields=id&limit=10&access_token=${page.access_token}`
                    );
                    const postsData = await postsRes.json();
                    for (const p of postsData.data || []) {
                        allPosts.push({ id: p.id });
                    }
                } catch (e) { }
            }

            let pageReplied = 0;
            let pageSkipped = 0;
            const postDebugList: any[] = [];

            for (const post of allPosts) {
                if (Date.now() - startTime > 48000) break;

                try {
                    const sinceTimestamp = Math.floor(cutoffTime.getTime() / 1000);
                    const usesSince = monitoredPostIds.length === 0;
                    const commentsUrl = `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from,is_hidden,created_time&limit=50&order=reverse_chronological${usesSince ? `&since=${sinceTimestamp}` : ''}&access_token=${page.access_token}`;
                    const commentsRes = await fetch(commentsUrl);
                    const commentsData = await commentsRes.json();

                    // Debug for specific posts
                    if (monitoredPostIds.length > 0) {
                        postDebugList.push({
                            post_id: post.id,
                            comments_found: commentsData.data?.length || 0,
                            error: commentsData.error?.message || null,
                            inbox_errors: [] as string[]
                        });
                    }

                    if (!commentsData.data) continue;

                    for (const comment of commentsData.data) {
                        if (comment.from?.id && comment.from.id === page.page_id) continue;
                        if (comment.is_hidden) continue;

                        // Time filter for specific posts (auto-scan uses since param)
                        if (comment.created_time && monitoredPostIds.length > 0) {
                            const commentDate = new Date(comment.created_time);
                            if (commentDate < cutoffTime) {
                                totalTooOld++;
                                continue;
                            }
                        }

                        totalProcessed++;

                        // DB DEDUP - only skip if BOTH replied AND inboxed
                        const { data: existing } = await supabase
                            .from('comment_auto_replies')
                            .select('id, replied, inboxed')
                            .eq('comment_id', comment.id)
                            .maybeSingle();

                        if (existing?.replied && existing?.inboxed) {
                            totalSkipped++;
                            pageSkipped++;
                            continue;
                        }

                        // FB DOUBLE-CHECK: if page already replied, skip reply but STILL try inbox
                        let alreadyRepliedOnFb = false;
                        try {
                            const repliesRes = await fetch(
                                `https://graph.facebook.com/v19.0/${comment.id}/comments?fields=from&limit=5&access_token=${page.access_token}`
                            );
                            const repliesData = await repliesRes.json();
                            alreadyRepliedOnFb = repliesData.data?.some((r: any) => r.from?.id === page.page_id) || false;
                        } catch (e) { }

                        // If already replied on FB but inbox not sent yet, try inbox then skip
                        if (alreadyRepliedOnFb || existing?.replied) {
                            // Method 1 (comment_id) doesn't need from.id, so don't require it
                            const needsInbox = !existing?.inboxed && inboxEnabled;
                            let inboxSuccess = false;
                            let inboxError = '';

                            if (needsInbox) {
                                // Method 1: me/messages with comment_id (doesn't need from.id)
                                try {
                                    const m1Res = await fetch(
                                        `https://graph.facebook.com/v19.0/me/messages?access_token=${page.access_token}`,
                                        { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ recipient: { comment_id: comment.id }, message: { text: inboxText }, messaging_type: 'RESPONSE' }) }
                                    );
                                    const m1Data = await m1Res.json();
                                    if (!m1Data.error) {
                                        inboxSuccess = true;
                                    } else {
                                        inboxError = `comment_id: code=${m1Data.error.code} subcode=${m1Data.error.error_subcode} msg=${m1Data.error.message}`;
                                    }
                                } catch (e) { inboxError = 'comment_id: network error'; }

                                // Method 2: fallback to user ID (only if from.id available)
                                if (!inboxSuccess && comment.from?.id) {
                                    try {
                                        const m2Res = await fetch(
                                            `https://graph.facebook.com/v19.0/me/messages?access_token=${page.access_token}`,
                                            { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ recipient: { id: comment.from.id }, message: { text: inboxText }, messaging_type: 'RESPONSE' }) }
                                        );
                                        const m2Data = await m2Res.json();
                                        if (!m2Data.error) {
                                            inboxSuccess = true;
                                            inboxError = '';
                                        } else {
                                            inboxError += ` | user_id: code=${m2Data.error.code} subcode=${m2Data.error.error_subcode} msg=${m2Data.error.message}`;
                                        }
                                    } catch (e) { inboxError += ' | user_id: network error'; }
                                }

                                if (inboxSuccess) totalInboxed++;
                            } else if (!inboxEnabled) {
                                inboxError = 'SKIPPED: inbox disabled in config';
                            }

                            // Add inbox error/status to debug
                            if (monitoredPostIds.length > 0 && postDebugList.length > 0) {
                                const lastDebug = postDebugList[postDebugList.length - 1];
                                if (lastDebug.inbox_errors) {
                                    if (inboxError) lastDebug.inbox_errors.push(inboxError);
                                    else if (inboxSuccess) lastDebug.inbox_errors.push(`OK: inbox sent to ${comment.from?.name || comment.id}`);
                                    else if (existing?.inboxed) lastDebug.inbox_errors.push(`SKIP: already inboxed ${comment.id}`);
                                }
                            }

                            // Save dedup record
                            await supabase.from('comment_auto_replies').upsert({
                                comment_id: comment.id, post_id: post.id, page_id: page.id,
                                commenter_id: comment.from?.id || '', commenter_name: comment.from?.name || '',
                                comment_text: comment.message || '', replied: true, inboxed: inboxSuccess || existing?.inboxed || false,
                                created_at: new Date().toISOString()
                            }, { onConflict: 'comment_id' });
                            totalAlreadyReplied++;
                            pageSkipped++;
                            continue;
                        }

                        // 1. REPLY
                        let replySuccess = false;
                        try {
                            const replyRes = await fetch(
                                `https://graph.facebook.com/v19.0/${comment.id}/comments?access_token=${page.access_token}`,
                                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: commentReplyText }) }
                            );
                            const replyData = await replyRes.json();
                            replySuccess = !replyData.error;
                            if (replySuccess) { totalReplied++; pageReplied++; }
                        } catch (e) { }

                        // 2. INBOX - send private message after reply
                        let inboxSuccess = false;
                        let inboxError = '';
                        if (inboxEnabled) {
                            // Method 1: me/messages with comment_id (Facebook recommended)
                            try {
                                const m1Res = await fetch(
                                    `https://graph.facebook.com/v19.0/me/messages?access_token=${page.access_token}`,
                                    { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ recipient: { comment_id: comment.id }, message: { text: inboxText }, messaging_type: 'RESPONSE' }) }
                                );
                                const m1Data = await m1Res.json();
                                if (!m1Data.error) {
                                    inboxSuccess = true;
                                } else {
                                    inboxError = `comment_id: code=${m1Data.error.code} subcode=${m1Data.error.error_subcode} msg=${m1Data.error.message}`;
                                }
                            } catch (e) { inboxError = 'comment_id: network error'; }

                            // Method 2: fallback to user ID (only if from.id available)
                            if (!inboxSuccess && comment.from?.id) {
                                try {
                                    const m2Res = await fetch(
                                        `https://graph.facebook.com/v19.0/me/messages?access_token=${page.access_token}`,
                                        { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ recipient: { id: comment.from.id }, message: { text: inboxText }, messaging_type: 'RESPONSE' }) }
                                    );
                                    const m2Data = await m2Res.json();
                                    if (!m2Data.error) {
                                        inboxSuccess = true;
                                        inboxError = '';
                                    } else {
                                        inboxError += ` | user_id: code=${m2Data.error.code} subcode=${m2Data.error.error_subcode} msg=${m2Data.error.message}`;
                                    }
                                } catch (e) { inboxError += ' | user_id: network error'; }
                            }

                            if (inboxSuccess) totalInboxed++;
                        }

                        // Add inbox error to debug
                        if (inboxError && monitoredPostIds.length > 0 && postDebugList.length > 0) {
                            const lastDebug = postDebugList[postDebugList.length - 1];
                            if (lastDebug.inbox_errors) lastDebug.inbox_errors.push(inboxError);
                        }

                        // 3. SAVE
                        await supabase.from('comment_auto_replies').upsert({
                            comment_id: comment.id, post_id: post.id, page_id: page.id,
                            commenter_id: comment.from?.id || '', commenter_name: comment.from?.name || '',
                            comment_text: comment.message || '', replied: replySuccess, inboxed: inboxSuccess,
                            created_at: new Date().toISOString()
                        }, { onConflict: 'comment_id' });

                        await new Promise(r => setTimeout(r, 500));
                    }
                } catch (e) { }
            }

            summary.push({
                page: page.name, posts: allPosts.length,
                mode: monitoredPostIds.length > 0 ? 'specific_posts' : 'auto_scan',
                replied: pageReplied, skipped: pageSkipped,
                ...(postDebugList.length > 0 ? { post_debug: postDebugList } : {})
            });
        }

        return NextResponse.json({
            version: VERSION, success: true,
            processed: totalProcessed, replied: totalReplied,
            inboxed: totalInboxed, skipped: totalSkipped,
            too_old: totalTooOld, already_replied_on_fb: totalAlreadyReplied,
            max_comment_age_hours: MAX_COMMENT_AGE_HOURS,
            elapsed_ms: Date.now() - startTime, summary
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
