export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { page_id, access_token, db_page_id } = await request.json();

        if (!page_id || !access_token || !db_page_id) {
            return NextResponse.json({ error: 'Missing page_id, access_token, or db_page_id' }, { status: 400 });
        }

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false }
        });

        // Get page config
        const { data: pageData } = await supabase
            .from('facebook_pages')
            .select('chatbot_config')
            .eq('id', db_page_id)
            .single();

        const config = (pageData?.chatbot_config as any) || {};
        const inboxEnabled = config.auto_comment_inbox_enabled !== false;
        const inboxText = config.auto_comment_inbox_text ||
            'ChÃ o báº¡n! ðŸ‘‹\nCáº£m Æ¡n báº¡n Ä‘Ã£ quan tÃ¢m Ä‘áº¿n sáº£n pháº©m LYHU!\nBáº¡n vui lÃ²ng cho mÃ¬nh xin SÄT Ä‘á»ƒ tÆ° váº¥n chi tiáº¿t hÆ¡n nhÃ© â¤ï¸';

        // Get chatbot rules
        const { data: rules } = await supabase
            .from('chatbot_rules')
            .select('*')
            .eq('is_active', true)
            .or(`page_id.is.null,page_id.eq.${db_page_id}`);

        // Fetch BOTH ads_posts (dark posts) and regular posts
        const allPosts: any[] = [];
        const seenPostIds = new Set<string>();

        // 1. Fetch ads_posts (includes dark posts NOT on page timeline)
        try {
            const adsPostsRes = await fetch(
                `https://graph.facebook.com/v19.0/${page_id}/ads_posts?fields=id&limit=25&access_token=${access_token}`
            );
            const adsPostsData = await adsPostsRes.json();
            if (adsPostsData.data) {
                for (const p of adsPostsData.data) {
                    if (!seenPostIds.has(p.id)) {
                        seenPostIds.add(p.id);
                        allPosts.push({ id: p.id, _is_ad: true });
                    }
                }
            }
        } catch (e) {
            console.log('Could not fetch ads_posts for scan');
        }

        // 2. Fetch regular published posts
        try {
            const postsRes = await fetch(
                `https://graph.facebook.com/v19.0/${page_id}/posts?fields=id,promotion_status&limit=10&access_token=${access_token}`
            );
            const postsData = await postsRes.json();
            if (postsData.data) {
                for (const p of postsData.data) {
                    if (!seenPostIds.has(p.id)) {
                        seenPostIds.add(p.id);
                        const isPromoted = p.promotion_status && p.promotion_status !== 'inactive';
                        allPosts.push({ id: p.id, _is_ad: isPromoted });
                    }
                }
            }
        } catch (e) {
            console.log('Could not fetch posts for scan');
        }

        if (allPosts.length === 0) {
            return NextResponse.json({ success: true, processed: 0, hidden: 0, replied: 0, inboxed: 0 });
        }

        let totalProcessed = 0;
        let totalHidden = 0;
        let totalReplied = 0;
        let totalInboxed = 0;

        for (const post of allPosts) {
            const isAdPost = post._is_ad;

            // Fetch comments for each post (limit 50)
            const commentsRes = await fetch(
                `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from,is_hidden&limit=50&access_token=${access_token}`
            );
            const commentsData = await commentsRes.json();

            if (!commentsData.data) continue;

            for (const comment of commentsData.data) {
                // Skip page's own comments
                if (comment.from?.id === page_id) continue;
                // Skip already hidden
                if (comment.is_hidden) continue;
                if (!comment.message) continue;

                totalProcessed++;
                const msgLower = comment.message.toLowerCase();
                let shouldHide = false;
                let shouldReply = false;
                let didReply = false;

                // 1. Check phone hide (applies to ALL posts)
                if (config.auto_hide_phone) {
                    const phoneRegex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/g;
                    if (phoneRegex.test(comment.message)) {
                        shouldHide = true;
                    }
                }

                // 2. Check keyword hide (applies to ALL posts)
                if (!shouldHide && config.auto_hide_keywords) {
                    const keywords = (config.auto_hide_keywords as string).split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
                    for (const kw of keywords) {
                        if (kw && msgLower.includes(kw)) {
                            shouldHide = true;
                            break;
                        }
                    }
                }

                // 3. Check chatbot rules
                let ruleMatched = false;
                if (rules) {
                    for (const rule of rules) {
                        const applyTo = rule.apply_to || 'comment';
                        if (applyTo !== 'comment' && applyTo !== 'both') continue;

                        const keywordLower = rule.keyword.toLowerCase();
                        let isMatch = false;
                        if (rule.match_type === 'exact') isMatch = msgLower === keywordLower;
                        else isMatch = msgLower.includes(keywordLower);

                        if (isMatch) {
                            ruleMatched = true;
                            const replyMethod = rule.reply_method || 'comment';

                            if (replyMethod === 'comment' || replyMethod === 'both') {
                                // Check if page already replied to this comment
                                const repliesRes = await fetch(
                                    `https://graph.facebook.com/v19.0/${comment.id}/comments?fields=from&limit=5&access_token=${access_token}`
                                );
                                const repliesData = await repliesRes.json();
                                const alreadyReplied = repliesData.data?.some((r: any) => r.from?.id === page_id);

                                if (!alreadyReplied) {
                                    await fetch(`https://graph.facebook.com/v19.0/${comment.id}/comments?access_token=${access_token}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ message: rule.response_text })
                                    });
                                    totalReplied++;
                                    shouldReply = true;
                                    didReply = true;
                                }
                            }

                            if (rule.auto_hide) shouldHide = true;
                            break;
                        }
                    }
                }

                // 4. Auto-reply ALL (if no rule matched)
                if (!ruleMatched && !shouldReply && config.auto_reply_comment && config.auto_reply_comment_text) {
                    const repliesRes = await fetch(
                        `https://graph.facebook.com/v19.0/${comment.id}/comments?fields=from&limit=5&access_token=${access_token}`
                    );
                    const repliesData = await repliesRes.json();
                    const alreadyReplied = repliesData.data?.some((r: any) => r.from?.id === page_id);

                    if (!alreadyReplied) {
                        await fetch(`https://graph.facebook.com/v19.0/${comment.id}/comments?access_token=${access_token}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: config.auto_reply_comment_text })
                        });
                        totalReplied++;
                        didReply = true;
                    }
                }

                // 5. Send inbox message after reply (if reply was sent)
                if (didReply && inboxEnabled) {
                    let inboxSuccess = false;

                    // Method 1: me/messages with comment_id (Facebook recommended)
                    try {
                        const m1Res = await fetch(
                            `https://graph.facebook.com/v19.0/me/messages?access_token=${access_token}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    recipient: { comment_id: comment.id },
                                    message: { text: inboxText },
                                    messaging_type: 'RESPONSE'
                                })
                            }
                        );
                        const m1Data = await m1Res.json();
                        if (!m1Data.error) {
                            inboxSuccess = true;
                        }
                    } catch (e) { }

                    // Method 2: fallback to user ID (only if from.id available)
                    if (!inboxSuccess && comment.from?.id) {
                        try {
                            const m2Res = await fetch(
                                `https://graph.facebook.com/v19.0/me/messages?access_token=${access_token}`,
                                {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        recipient: { id: comment.from.id },
                                        message: { text: inboxText },
                                        messaging_type: 'RESPONSE'
                                    })
                                }
                            );
                            const m2Data = await m2Res.json();
                            if (!m2Data.error) {
                                inboxSuccess = true;
                            }
                        } catch (e) { }
                    }

                    if (inboxSuccess) totalInboxed++;
                }

                // 6. Auto-hide on AD POSTS only (not regular posts)
                if (!shouldHide && config.auto_hide_all && isAdPost) {
                    shouldHide = true;
                }

                // Execute hide
                if (shouldHide) {
                    await fetch(`https://graph.facebook.com/v19.0/${comment.id}?access_token=${access_token}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_hidden: true })
                    });
                    totalHidden++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: totalProcessed,
            hidden: totalHidden,
            replied: totalReplied,
            inboxed: totalInboxed
        });

    } catch (error: any) {
        console.error('Scan Comments Error:', error);
        return NextResponse.json({ error: error.message || 'Scan failed' }, { status: 500 });
    }
}


