import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripYearFromTitle } from '@/lib/titleSimilarity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (token !== 'lyhu_clean_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dryRun = req.nextUrl.searchParams.get('dry_run') === 'true';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Fetch all published posts that might contain 2026
        let allPosts: Array<{ id: string; title: string; meta_title: string | null }> = [];
        let from = 0;
        const pageSize = 1000;

        while (true) {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('id, title, meta_title')
                .eq('status', 'published')
                .range(from, from + pageSize - 1);

            if (error) throw error;
            if (!data || data.length === 0) break;
            allPosts.push(...data);
            if (data.length < pageSize) break;
            from += pageSize;
        }

        // 2. Identify all posts whose title changes after stripping year
        const updates: Array<{ id: string; oldTitle: string; newTitle: string; oldMetaTitle: string | null; newMetaTitle: string | null }> = [];

        for (const post of allPosts) {
            if (!post.title) continue;
            const newTitle = stripYearFromTitle(post.title);
            const newMetaTitle = post.meta_title ? stripYearFromTitle(post.meta_title) : null;

            if (newTitle !== post.title || (post.meta_title && newMetaTitle !== post.meta_title)) {
                updates.push({
                    id: post.id,
                    oldTitle: post.title,
                    newTitle,
                    oldMetaTitle: post.meta_title,
                    newMetaTitle
                });
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Không có tiêu đề bài viết nào cần gọt bỏ số năm.',
                totalChecked: allPosts.length,
                updatedCount: 0
            });
        }

        if (dryRun) {
            return NextResponse.json({
                success: true,
                dryRun: true,
                message: `Tìm thấy ${updates.length} bài viết có tiêu đề dính số năm cần làm sạch.`,
                totalChecked: allPosts.length,
                updatesCount: updates.length,
                preview: updates.slice(0, 30)
            });
        }

        // 3. Execute updates in parallel chunks of 20 for high performance
        const chunkSize = 20;
        let totalUpdated = 0;

        for (let i = 0; i < updates.length; i += chunkSize) {
            const chunk = updates.slice(i, i + chunkSize);
            const results = await Promise.all(
                chunk.map(async (item) => {
                    const payload: any = { title: item.newTitle };
                    if (item.newMetaTitle) {
                        payload.meta_title = item.newMetaTitle;
                    }
                    const { error } = await supabase
                        .from('blog_posts')
                        .update(payload)
                        .eq('id', item.id);
                    return !error;
                })
            );
            totalUpdated += results.filter(Boolean).length;
        }

        return NextResponse.json({
            success: true,
            message: `Đã làm sạch tiêu đề thành công cho ${totalUpdated} / ${updates.length} bài viết!`,
            totalChecked: allPosts.length,
            updatedCount: totalUpdated,
            sample: updates.slice(0, 15)
        });

    } catch (err: any) {
        console.error('Lỗi API strip-years:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
