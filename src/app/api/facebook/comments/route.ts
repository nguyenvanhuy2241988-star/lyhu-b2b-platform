import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { page_id, access_token, user_token, action, comment_id, post_id } = await request.json();
        // user_token = long-lived user token for reading comments (has pages_read_engagement)
        // access_token = page token for reading posts (required by NPE pages)
        const commentToken = user_token || access_token;

        if (!page_id || !access_token) {
            return NextResponse.json({ error: 'Missing page_id or access_token' }, { status: 400 });
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

        // 3. Fetch regular published posts (fallback)
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
        const commentErrors: any[] = [];
        const posts = await Promise.all(allPosts.map(async (post: any) => {
            let comments: any[] = [];
            let hiddenCount = 0;
            let totalCount = 0;
            try {
                const commRes = await fetch(
                    `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from,created_time,is_hidden&filter=stream&limit=50&summary=true&access_token=${commentToken}`
                );
                const commData = await commRes.json();
                if (commData.error) {
                    commentErrors.push({ post_id: post.id, error1: commData.error.message });
                    // Fallback: try without is_hidden (may not have permission)
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

        return NextResponse.json({ success: true, posts, debug: { ...debug, comment_errors: commentErrors } });

    } catch (error: any) {
        console.error('Comments API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}
