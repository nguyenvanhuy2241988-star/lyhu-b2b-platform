import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('job_id');

        if (!jobId) {
            return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
        }

        // 1. Check Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Job to ensure it exists and belongs to user (or user is admin)
        const { data: job, error } = await supabase
            .from('marketing_scrape_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // 3. Return Results (MOCK DATA)
        // In real app, we would fetch from a 'marketing_scrape_results' table
        // where job_id = jobId.

        const mockResults = Array.from({ length: job.processed_count }).map((_, i) => ({
            id: `res_${jobId}_${i}`,
            facebook_name: `User Facebook ${i + 1}`,
            facebook_id: `fb_id_${i}`,
            phone: `09${Math.floor(Math.random() * 100000000)}`,
            content: `Mình quan tâm sản phẩm này, tư vấn nhé. SĐT của mình là 09...`,
            post_url: job.target_url,
            comment_url: `${job.target_url}?comment_id=${i}`,
            is_saved: false // Check if already in CRM in real app
        }));

        return NextResponse.json({ results: mockResults });

    } catch (error: any) {
        console.error('Fetch Results Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
