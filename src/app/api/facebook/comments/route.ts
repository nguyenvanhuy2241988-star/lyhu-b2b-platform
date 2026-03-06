import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { page_id, access_token, action, comment_id, post_id } = await request.json();

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

        // DEFAULT: Fetch recent posts with comment counts
        // Try ads_posts first, then regular posts
        let adPostIds = new Set<string>();
        try {
            const adsRes = await fetch(
                `https://graph.facebook.com/v19.0/${page_id}/ads_posts?fields=id&limit=50&access_token=${access_token}`
            );
            const adsData = await adsRes.json();
            if (adsData.data) {
                adsData.data.forEach((p: any) => adPostIds.add(p.id));
            }
        } catch (e) {
            // ads_posts might not be available
        }

        // Fetch published posts  
        const postsRes = await fetch(
            `https://graph.facebook.com/v19.0/${page_id}/posts?fields=id,message,created_time,full_picture,permalink_url,promotion_status&limit=15&access_token=${access_token}`
        );
        const postsData = await postsRes.json();

        if (!postsData.data) {
            return NextResponse.json({ success: true, posts: [] });
        }

        // Enrich each post with comment counts and ad status
        const posts = await Promise.all(postsData.data.map(async (post: any) => {
            // Get comments count
            let comments: any[] = [];
            let hiddenCount = 0;
            let totalCount = 0;
            try {
                const commRes = await fetch(
                    `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from,created_time,is_hidden&limit=50&summary=true&access_token=${access_token}`
                );
                const commData = await commRes.json();
                comments = commData.data || [];
                totalCount = commData.summary?.total_count || comments.length;
                hiddenCount = comments.filter((c: any) => c.is_hidden).length;
            } catch (e) {
                // ignore
            }

            const isAd = adPostIds.has(post.id) ||
                (post.promotion_status && post.promotion_status !== 'inactive');

            return {
                id: post.id,
                message: post.message || '(Không có nội dung)',
                created_time: post.created_time,
                full_picture: post.full_picture,
                permalink_url: post.permalink_url,
                is_ad: isAd,
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

        return NextResponse.json({ success: true, posts });

    } catch (error: any) {
        console.error('Comments API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}
