import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTitleWordSet, calculateTitleSimilarity } from '@/lib/titleSimilarity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (token !== 'lyhu_clean_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mode = req.nextUrl.searchParams.get('mode') || 'archive'; // 'archive' | 'delete'
    const dryRun = req.nextUrl.searchParams.get('dry_run') === 'true';
    const threshold = parseFloat(req.nextUrl.searchParams.get('threshold') || '0.60');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Fetch all published posts
        let allPosts: Array<{ id: string; title: string; slug: string; created_at: string; words?: Set<string> }> = [];
        let from = 0;
        const pageSize = 1000;

        while (true) {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('id, title, slug, created_at')
                .eq('status', 'published')
                .order('created_at', { ascending: false }) // Newest first
                .range(from, from + pageSize - 1);

            if (error) throw error;
            if (!data || data.length === 0) break;
            allPosts.push(...data);
            if (data.length < pageSize) break;
            from += pageSize;
        }

        // 2. Precompute word sets
        for (const p of allPosts) {
            p.words = getTitleWordSet(p.title);
        }

        // 3. Cluster duplicate posts using similarity threshold (>= 60%)
        const visited = new Set<string>();
        const clusters: Array<{
            newest: { id: string; title: string; slug: string; created_at: string };
            older: Array<{ id: string; title: string; slug: string; created_at: string; similarity: number }>;
        }> = [];

        const redundantIds: string[] = [];

        for (let i = 0; i < allPosts.length; i++) {
            const postA = allPosts[i];
            if (visited.has(postA.id)) continue;

            visited.add(postA.id);
            const duplicates: Array<{ id: string; title: string; slug: string; created_at: string; similarity: number }> = [];

            for (let j = i + 1; j < allPosts.length; j++) {
                const postB = allPosts[j];
                if (visited.has(postB.id)) continue;

                const sim = calculateTitleSimilarity(postA.title, postB.title);
                if (sim >= threshold) {
                    duplicates.push({
                        id: postB.id,
                        title: postB.title,
                        slug: postB.slug,
                        created_at: postB.created_at,
                        similarity: Math.round(sim * 100)
                    });
                    visited.add(postB.id);
                    redundantIds.push(postB.id);
                }
            }

            if (duplicates.length > 0) {
                clusters.push({
                    newest: {
                        id: postA.id,
                        title: postA.title,
                        slug: postA.slug,
                        created_at: postA.created_at
                    },
                    older: duplicates
                });
            }
        }

        if (redundantIds.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Không tìm thấy bài viết trùng lặp nào (độ tương đồng >= 60%).',
                totalPublishedPosts: allPosts.length,
                redundantCount: 0
            });
        }

        if (dryRun) {
            return NextResponse.json({
                success: true,
                dryRun: true,
                message: `Phát hiện ${clusters.length} cụm trùng lặp với ${redundantIds.length} bài viết cũ cần xử lý.`,
                totalPublishedPosts: allPosts.length,
                redundantCount: redundantIds.length,
                clustersSummary: clusters.slice(0, 30)
            });
        }

        // 4. Execute cleanup: Batch update to 'archived' or delete
        const batchSize = 50;
        let processedCount = 0;

        for (let i = 0; i < redundantIds.length; i += batchSize) {
            const batch = redundantIds.slice(i, i + batchSize);

            if (mode === 'delete') {
                const { error: delError } = await supabase
                    .from('blog_posts')
                    .delete()
                    .in('id', batch);

                if (delError) {
                    console.error(`Lỗi xóa batch ${i}:`, delError);
                    throw delError;
                }
            } else {
                // Default: archive
                const { error: patchError } = await supabase
                    .from('blog_posts')
                    .update({ status: 'archived' })
                    .in('id', batch);

                if (patchError) {
                    console.error(`Lỗi lưu trữ batch ${i}:`, patchError);
                    throw patchError;
                }
            }

            processedCount += batch.length;
        }

        return NextResponse.json({
            success: true,
            action: mode,
            message: `Đã xử lý thành công ${processedCount} bài viết trùng lặp (giữ lại bài mới nhất trong mỗi nhóm)!`,
            totalPublishedPostsBefore: allPosts.length,
            totalPublishedPostsAfter: allPosts.length - processedCount,
            redundantCount: processedCount,
            duplicateClustersCount: clusters.length,
            clustersSample: clusters.slice(0, 15)
        });

    } catch (err: any) {
        console.error('Lỗi API clean-duplicates:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
