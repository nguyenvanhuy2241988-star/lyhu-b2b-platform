import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (token !== 'lyhu_clean_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        let allPosts: Array<{ id: string; title: string; created_at: string }> = [];
        let from = 0;
        const pageSize = 1000;

        while (true) {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('id, title, created_at')
                .order('created_at', { ascending: true })
                .range(from, from + pageSize - 1);

            if (error) throw error;
            if (!data || data.length === 0) break;
            allPosts.push(...data);
            if (data.length < pageSize) break;
            from += pageSize;
        }

        const titleMap: Record<string, Array<{ id: string; title: string; created_at: string }>> = {};
        for (const post of allPosts) {
            const t = (post.title || '').trim();
            if (!t) continue;
            if (!titleMap[t]) {
                titleMap[t] = [];
            }
            titleMap[t].push(post);
        }

        const idsToDelete: string[] = [];
        const duplicateSummary: Array<{ title: string; total: number; deleted: number }> = [];

        for (const [title, list] of Object.entries(titleMap)) {
            if (list.length > 1) {
                // list is ordered by created_at asc, so list[0] is the oldest/original post.
                // Keep list[0], delete the rest
                const redundant = list.slice(1);
                for (const r of redundant) {
                    idsToDelete.push(r.id);
                }
                duplicateSummary.push({
                    title,
                    total: list.length,
                    deleted: redundant.length
                });
            }
        }

        if (idsToDelete.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Không tìm thấy bài viết trùng lặp nào.',
                totalPosts: allPosts.length,
                deletedCount: 0
            });
        }

        // Delete in batches of 30
        const batchSize = 30;
        let totalDeleted = 0;
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
            const batch = idsToDelete.slice(i, i + batchSize);
            const { error: delError } = await supabase
                .from('blog_posts')
                .delete()
                .in('id', batch);

            if (delError) {
                console.error(`Lỗi xóa batch ${i}:`, delError);
                throw delError;
            }
            totalDeleted += batch.length;
        }

        return NextResponse.json({
            success: true,
            message: `Đã xóa thành công ${totalDeleted} bài viết trùng lặp dư thừa!`,
            totalPostsBefore: allPosts.length,
            totalPostsAfter: allPosts.length - totalDeleted,
            deletedCount: totalDeleted,
            duplicateGroupsCount: duplicateSummary.length,
            details: duplicateSummary
        });

    } catch (err: any) {
        console.error('Lỗi API clean-duplicates:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
