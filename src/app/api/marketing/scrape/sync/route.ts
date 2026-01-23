import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // 1. Check Auth (Optional for public webhook, but required if triggered by client)
        const { data: { session } } = await supabase.auth.getSession();

        // In a real webhook, we would verify the signature instead of session
        // For manual sync from client:
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { job_id } = body;

        if (!job_id) {
            // Sync all running jobs for this user
            const { data: jobs } = await supabase
                .from('marketing_scrape_jobs')
                .select('*')
                .eq('status', 'running');

            if (jobs && jobs.length > 0) {
                for (const job of jobs) {
                    await syncJob(supabase, job);
                }
            }
            return NextResponse.json({ success: true, count: jobs?.length || 0 });
        }

        // Sync specific job
        const { data: job } = await supabase
            .from('marketing_scrape_jobs')
            .select('*')
            .eq('id', job_id)
            .single();

        if (job) {
            await syncJob(supabase, job);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Scrape Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function syncJob(supabase: any, job: any) {
    // MOCK LOGIC: If it's a mock run, we just finish it with random results
    if (job.apify_run_id?.startsWith('mock_')) {
        const mockResultCount = Math.floor(Math.random() * 50) + 10; // 10-60 items
        const mockProcessedCount = Math.floor(mockResultCount * 0.4); // 40% have phones

        await supabase
            .from('marketing_scrape_jobs')
            .update({
                status: 'completed',
                result_count: mockResultCount,
                processed_count: mockProcessedCount
                // We would also save the raw results to a storage bucket or another table here
            })
            .eq('id', job.id);
    } else {
        // REAL LOGIC:
        // 1. Call Apify Client.run(job.apify_run_id).get()
        // 2. Check status.
        // 3. If SUCCEEDED, fetch dataset.
        // 4. Parse dataset for phones.
        // 5. Update DB.
    }
}
