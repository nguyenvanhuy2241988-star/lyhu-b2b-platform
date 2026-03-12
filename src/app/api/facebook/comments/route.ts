import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { page_id, access_token, user_token, action, comment_id, post_id } = await request.json();
        // NPE pages require Page Token for ALL operations including reading comments
        // access_token = page token (preferred for NPE pages)
        // user_token = long-lived user token (fallback for pages_read_engagement)
        const commentToken = access_token;
        // For scanning ALL comments, prefer user_token if available (has pages_read_engagement)
        const scanToken = user_token || access_token;

        if (!page_id || !access_token) {
            return NextResponse.json({ error: 'Missing page_id or access_token' }, { status: 400 });
        }

        // ACTION: Debug token permissions
        if (action === 'debug_token') {
            const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FB_APP_ID;
            const FB_APP_SECRET = process.env.FB_APP_SECRET;
            const results: any = { page_token: {}, user_token: {} };
            
            // Debug page token
            try {
                if (FB_APP_ID && FB_APP_SECRET) {
                    const debugRes = await fetch(
                        `https://graph.facebook.com/v19.0/debug_token?input_token=${access_token}&access_token=${FB_APP_ID}|${FB_APP_SECRET}`
                    );
                    const debugData = await debugRes.json();
                    results.page_token = {
                        scopes: debugData.data?.scopes || [],
                        type: debugData.data?.type,
                        app_id: debugData.data?.app_id,
                        is_valid: debugData.data?.is_valid,
                        has_pages_read_engagement: (debugData.data?.scopes || []).includes('pages_read_engagement'),
                        has_pages_read_user_content: (debugData.data?.scopes || []).includes('pages_read_user_content'),
                    };
                }
            } catch (_) {}
            
            // Debug user token  
            if (user_token) {
                try {
                    if (FB_APP_ID && FB_APP_SECRET) {
                        const debugRes = await fetch(
                            `https://graph.facebook.com/v19.0/debug_token?input_token=${user_token}&access_token=${FB_APP_ID}|${FB_APP_SECRET}`
                        );
                        const debugData = await debugRes.json();
                        results.user_token = {
                            scopes: debugData.data?.scopes || [],
                            type: debugData.data?.type,
                            is_valid: debugData.data?.is_valid,
                            has_pages_read_engagement: (debugData.data?.scopes || []).includes('pages_read_engagement'),
                            has_pages_read_user_content: (debugData.data?.scopes || []).includes('pages_read_user_content'),
                        };
                    }
                } catch (_) {}
            }
            
            // Quick test: try to read 1 comment
            try {
                const testRes = await fetch(
                    `https://graph.facebook.com/v19.0/${page_id}/feed?fields=comments.limit(1){message}&limit=1&access_token=${access_token}`
                );
                const testData = await testRes.json();
                results.comment_test = {
                    has_feed: !!testData.data,
                    first_post_has_comments: !!testData.data?.[0]?.comments,
                    error: testData.error?.message,
                };
            } catch (_) {}
            
            return NextResponse.json({ success: true, debug: results });
        }

        // ACTION: hide/unhide a comment
        if (action === 'hide' && comment_id) {
            const res = await fetch(`https://graph.facebook.com/v19.0/${comment_id}?access_token=${access_token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_hidden: true })
            });
            const data = await res.json();
            return NextResponse.json({ success: !data.error, data });
        }

        if (action === 'unhide' && comment_id) {
            const res = await fetch(`https://graph.facebook.com/v19.0/${comment_id}?access_token=${access_token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_hidden: false })
            });
            const data = await res.json();
            return NextResponse.json({ success: !data.error, data });
        }

        // ACTION: Scan ALL comments with full pagination (for minigame / contest)
        if (action === 'scan_all_comments' && post_id) {
            try {
                // post_id should now be numeric (from dropdown), but handle pfbid just in case
                let targetPostId = post_id;
                if (post_id.includes('pfbid')) {
                    // Fallback: try to resolve pfbid
                    const pfbidPart = post_id.includes('_') ? post_id.split('_').pop() : post_id;
                    try {
                        const rr = await fetch(`https://graph.facebook.com/v19.0/${pfbidPart}?fields=id&access_token=${access_token}`);
                        const rd = await rr.json();
                        if (rd.id) targetPostId = rd.id;
                    } catch (_) {}
                }
                
                // APPROACH 1: Field expansion — get comments as nested field of the post
                // This is a DIFFERENT API path than /{post_id}/comments
                const tokens = [access_token, ...(user_token ? [user_token] : [])];
                let firstPageData: any = null;
                let workingUrl: string | null = null;
                let usedMethod = '';
                
                // PRIORITY: Try to get FULL data (with names) first, using ANY token
                // Then fallback to less data. This ensures we get names if possible.
                const expansionFieldSets = [
                    '{id,message,from,created_time}',  // Full with names (priority!)
                    '{id,message,created_time}',         // Without names
                    '{id,message}',                      // Minimal
                ];
                
                for (const fields of expansionFieldSets) {
                    for (const tkn of tokens) {
                        const url = `https://graph.facebook.com/v19.0/${targetPostId}?fields=comments.limit(100)${fields}&access_token=${tkn}`;
                        try {
                            const r: Response = await fetch(url);
                            const d: any = await r.json();
                            if (!d.error && d.comments?.data) {
                                firstPageData = d.comments;
                                workingUrl = d.comments.paging?.next || null;
                                usedMethod = `field_expansion_${fields.includes('from') ? 'with_names' : 'no_names'}`;
                                break;
                            }
                        } catch (_) {}
                    }
                    if (firstPageData) break;
                }
                
                // APPROACH 2: Direct /comments edge (fallback)
                if (!firstPageData) {
                    const fieldSets = [
                        'id,message,from,created_time',
                        'id,message,created_time',
                        'id,message',
                        '',
                    ];
                    outer:
                    for (const fields of fieldSets) {
                        for (const tkn of tokens) {
                            const fieldParam = fields ? `&fields=${fields}` : '';
                            const testUrl = `https://graph.facebook.com/v19.0/${targetPostId}/comments?limit=100${fieldParam}&access_token=${tkn}`;
                            try {
                                const testRes: Response = await fetch(testUrl);
                                const testData: any = await testRes.json();
                                if (!testData.error && testData.data) {
                                    firstPageData = testData;
                                    workingUrl = testData.paging?.next || null;
                                    usedMethod = `direct_${fields.includes('from') ? 'with_names' : 'no_names'}`;
                                    break outer;
                                }
                            } catch (_) {}
                        }
                    }
                }
                
                if (!firstPageData) {
                    return NextResponse.json({
                        success: false,
                        error: 'Không thể đọc comment. Tất cả cách thử đều bị từ chối.',
                        error_code: 10,
                        hint: 'Facebook App cần được App Review cho quyền pages_read_engagement. Vào developers.facebook.com → App Dashboard → App Review để gửi yêu cầu.'
                    });
                }
                
                // Process first page
                const allComments: any[] = [];
                
                // Extract name from comment text when from.name is unavailable
                // Common patterns: "368 Nguyễn Văn A", "368 > Nguyễn Văn A", "#368 Nguyễn Văn A"
                const extractNameFromMessage = (msg: string): string => {
                    if (!msg) return 'Người chơi';
                    // Remove the number part and extract the remaining text as name
                    // Pattern: optional #, digits, optional > or space, then the name
                    const nameMatch = msg.match(/^[#]?\d{1,5}\s*[>:\-–]?\s*(.+)/);
                    if (nameMatch) {
                        let name = nameMatch[1].trim();
                        // Limit to first few words (typical Vietnamese name is 2-4 words)
                        const words = name.split(/\s+/);
                        if (words.length > 5) {
                            name = words.slice(0, 4).join(' ');
                        }
                        // Remove trailing text that looks like extra commentary
                        name = name.replace(/\s*(mong|chúc|hy vọng|cầu|mình|em|con|tui|thanks|cám|chọn|số).*/i, '').trim();
                        if (name.length > 1 && name.length < 50) return name;
                    }
                    return 'Người chơi';
                };
                
                const mapComment = (c: any) => ({
                    id: c.id,
                    name: c.from?.name || extractNameFromMessage(c.message || ''),
                    from_id: c.from?.id || '',
                    message: c.message || '',
                    created_time: c.created_time || '',
                });
                
                allComments.push(...(firstPageData.data || []).map(mapComment));
                
                // Continue pagination
                let pageNum = 1;
                const MAX_PAGES = 50;
                while (workingUrl && pageNum < MAX_PAGES) {
                    try {
                        const res: Response = await fetch(workingUrl);
                        const data: any = await res.json();
                        if (data.error || !data.data) break;
                        allComments.push(...data.data.map(mapComment));
                        workingUrl = data.paging?.next || null;
                        pageNum++;
                    } catch (_) { break; }
                }

                return NextResponse.json({
                    success: true,
                    total: allComments.length,
                    comments: allComments,
                    debug: { resolved_post_id: targetPostId, method: usedMethod || 'default', pages_fetched: pageNum }
                });
            } catch (e: any) {
                return NextResponse.json({ success: false, error: e.message });
            }
        }

        // ACTION: fetch comments for a specific post
        if (action === 'post_comments' && post_id) {
            const res = await fetch(
                `https://graph.facebook.com/v19.0/${post_id}/comments?fields=id,message,from,created_time,is_hidden,comment_count&limit=100&access_token=${access_token}`
            );
            const data = await res.json();
            return NextResponse.json({ success: true, comments: data.data || [] });
        }

        // ACTION: Manually add a single post by ID (for ad/dark posts)
        if (action === 'manual_post' && post_id) {
            try {
                const postRes = await fetch(
                    `https://graph.facebook.com/v19.0/${post_id}?fields=id,message,created_time,full_picture,permalink_url&access_token=${access_token}`
                );
                const postData = await postRes.json();
                if (postData.error) {
                    return NextResponse.json({ success: false, error: postData.error.message });
                }

                // Fetch comments for this post
                let comments: any[] = [];
                let hiddenCount = 0;
                let totalCount = 0;
                try {
                    const commRes = await fetch(
                        `https://graph.facebook.com/v19.0/${postData.id}/comments?fields=id,message,from,created_time,is_hidden&filter=stream&limit=50&summary=true&access_token=${commentToken}`
                    );
                    const commData = await commRes.json();
                    if (commData.error) {
                        // Fallback without is_hidden
                        const commRes2 = await fetch(
                            `https://graph.facebook.com/v19.0/${postData.id}/comments?fields=id,message,from,created_time&filter=stream&limit=50&summary=true&access_token=${commentToken}`
                        );
                        const commData2 = await commRes2.json();
                        if (!commData2.error) {
                            comments = commData2.data || [];
                            totalCount = commData2.summary?.total_count || comments.length;
                        }
                    } else {
                        comments = commData.data || [];
                        totalCount = commData.summary?.total_count || comments.length;
                        hiddenCount = comments.filter((c: any) => c.is_hidden).length;
                    }
                } catch (e) { }

                return NextResponse.json({
                    success: true,
                    post: {
                        id: postData.id,
                        message: postData.message || '(Bài quảng cáo)',
                        created_time: postData.created_time,
                        full_picture: postData.full_picture,
                        permalink_url: postData.permalink_url,
                        is_ad: true,
                        total_comments: totalCount,
                        hidden_comments: hiddenCount,
                        comments: comments.map((c: any) => ({
                            id: c.id,
                            message: c.message,
                            from_name: c.from?.name || 'Unknown',
                            from_id: c.from?.id,
                            created_time: c.created_time,
                            is_hidden: c.is_hidden || false
                        }))
                    }
                });
            } catch (e: any) {
                return NextResponse.json({ success: false, error: e.message });
            }
        }

        // DEFAULT: Fetch BOTH regular posts AND ads/dark posts
        const allPosts: any[] = [];
        const seenPostIds = new Set<string>();
        const debug: any = { ads_posts: null, feed: null, posts: null };

        // 1. Try ads_posts (dark posts NOT on page timeline)
        try {
            const adsRes = await fetch(
                `https://graph.facebook.com/v19.0/${page_id}/ads_posts?fields=id,message,created_time,full_picture,permalink_url&limit=25&access_token=${access_token}`
            );
            const adsData = await adsRes.json();
            debug.ads_posts = { count: adsData.data?.length || 0, error: adsData.error || null };
            if (adsData.data) {
                for (const post of adsData.data) {
                    if (!seenPostIds.has(post.id)) {
                        seenPostIds.add(post.id);
                        allPosts.push({ ...post, _is_ad: true });
                    }
                }
            }
        } catch (e: any) {
            debug.ads_posts = { error: e.message };
        }

        // 2. Try feed (includes ALL posts: regular, dark, shared)
        try {
            const feedRes = await fetch(
                `https://graph.facebook.com/v19.0/${page_id}/feed?fields=id,message,created_time,full_picture,permalink_url,is_hidden,status_type,is_published&limit=30&access_token=${access_token}`
            );
            const feedData = await feedRes.json();
            debug.feed = { count: feedData.data?.length || 0, error: feedData.error || null };
            if (feedData.data) {
                for (const post of feedData.data) {
                    if (!seenPostIds.has(post.id)) {
                        seenPostIds.add(post.id);
                        // Posts from feed that are NOT published = dark/ad posts
                        const isDark = post.is_published === false;
                        allPosts.push({ ...post, _is_ad: isDark });
                    }
                }
            }
        } catch (e: any) {
            debug.feed = { error: e.message };
        }

        // 3. Fetch regular published posts
        try {
            const postsRes = await fetch(
                `https://graph.facebook.com/v19.0/${page_id}/posts?fields=id,message,created_time,full_picture,permalink_url,promotion_status&limit=15&access_token=${access_token}`
            );
            const postsData = await postsRes.json();
            debug.posts = { count: postsData.data?.length || 0, error: postsData.error || null };
            if (postsData.data) {
                for (const post of postsData.data) {
                    if (!seenPostIds.has(post.id)) {
                        seenPostIds.add(post.id);
                        const isPromoted = post.promotion_status && post.promotion_status !== 'inactive';
                        allPosts.push({ ...post, _is_ad: isPromoted });
                    }
                }
            }
        } catch (e: any) {
            debug.posts = { error: e.message };
        }

        if (allPosts.length === 0) {
            return NextResponse.json({ success: true, posts: [], debug });
        }

        // Sort by created_time descending
        allPosts.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());

        // Enrich each post with comment counts
        // Try to use pre-loaded comments from nested query first (bypasses permission issue)
        const commentErrors: any[] = [];
        const posts = await Promise.all(allPosts.map(async (post: any) => {
            let comments: any[] = [];
            let hiddenCount = 0;
            let totalCount = 0;

            // Strategy 1: Use pre-loaded nested comments (from posts query with comments{} field)
            if (post.comments && post.comments.data) {
                comments = post.comments.data;
                totalCount = post.comments.summary?.total_count || comments.length;
                hiddenCount = comments.filter((c: any) => c.is_hidden).length;
            } else {
                // Strategy 2: Fallback to separate endpoint (may fail without pages_read_engagement)
                try {
                    const commRes = await fetch(
                        `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from,created_time,is_hidden&filter=stream&limit=50&summary=true&access_token=${commentToken}`
                    );
                    const commData = await commRes.json();
                    if (commData.error) {
                        commentErrors.push({ post_id: post.id, error1: commData.error.message });
                        // Fallback 2b: try without is_hidden
                        const commRes2 = await fetch(
                            `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from,created_time&filter=stream&limit=50&summary=true&access_token=${commentToken}`
                        );
                        const commData2 = await commRes2.json();
                        if (!commData2.error) {
                            comments = commData2.data || [];
                            totalCount = commData2.summary?.total_count || comments.length;
                        } else {
                            commentErrors.push({ post_id: post.id, error2: commData2.error.message });
                        }
                    } else {
                        comments = commData.data || [];
                        totalCount = commData.summary?.total_count || comments.length;
                        hiddenCount = comments.filter((c: any) => c.is_hidden).length;
                    }
                } catch (e: any) {
                    commentErrors.push({ post_id: post.id, exception: e.message });
                }
            }

            return {
                id: post.id,
                message: post.message || '(Không có nội dung)',
                created_time: post.created_time,
                full_picture: post.full_picture,
                permalink_url: post.permalink_url,
                is_ad: post._is_ad || false,
                promotion_status: post.promotion_status,
                total_comments: totalCount,
                hidden_comments: hiddenCount,
                comments: comments.map((c: any) => ({
                    id: c.id,
                    message: c.message,
                    from_name: c.from?.name || 'Unknown',
                    from_id: c.from?.id,
                    created_time: c.created_time,
                    is_hidden: c.is_hidden || false
                }))
            };
        }));

        const tokenInfo = {
            has_user_token: !!user_token,
            comment_token_type: 'page_token (NPE required)',
            comment_token_prefix: commentToken?.substring(0, 10) + '...',
            page_token_prefix: access_token?.substring(0, 10) + '...',
        };

        return NextResponse.json({ success: true, posts, debug: { ...debug, comment_errors: commentErrors, token_info: tokenInfo } });

    } catch (error: any) {
        console.error('Comments API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}
