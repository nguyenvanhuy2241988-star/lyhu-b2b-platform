import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
        const body = await req.json();
        const { slug, updates } = body;

        if (!slug || !updates) {
            return NextResponse.json({ error: 'Missing slug or updates in body' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .update(updates)
            .eq('slug', slug)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            slug,
            updatedCount: data?.length || 0,
            post: data?.[0]
        });

    } catch (err: any) {
        console.error('Lỗi API update-post:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
