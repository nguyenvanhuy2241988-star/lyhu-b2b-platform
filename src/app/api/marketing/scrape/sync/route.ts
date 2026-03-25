import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export const dynamic = 'force-dynamic';

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

        // 1. Check Auth
        const { data: { session } } = await supabase.auth.getSession();
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
    if (!job.apify_run_id) return;
    if (job.job_type === 'google_places_api') return; // Google API jobs are already completed

    // Handle Mock Runs (Legacy support or fallback)
    if (job.apify_run_id.startsWith('mock_')) {
        // ... (Keep existing mock logic if needed, or just skip)
        const mockResultCount = Math.floor(Math.random() * 50) + 10;
        await supabase
            .from('marketing_scrape_jobs')
            .update({
                status: 'completed',
                result_count: mockResultCount,
                processed_count: Math.floor(mockResultCount * 0.4)
            })
            .eq('id', job.id);
        return;
    }

    try {
        const apifyToken = process.env.APIFY_API_TOKEN;
        if (!apifyToken) return;

        const client = new ApifyClient({ token: apifyToken });
        const run = await client.run(job.apify_run_id).get();

        if (!run) return;

        let newStatus = job.status;
        const apifyStatus = run.status; // READY, RUNNING, SUCCEEDED, FAILED, TIMED-OUT, ABORTED

        if (apifyStatus === 'SUCCEEDED') {
            newStatus = 'completed';
        } else if (['FAILED', 'TIMED-OUT', 'ABORTED'].includes(apifyStatus)) {
            newStatus = 'failed';
        } else if (apifyStatus === 'RUNNING') {
            newStatus = 'running';
        }

        // Prepare updates
        const updates: any = { status: newStatus };

        // If completed, get item count from dataset
        if (newStatus === 'completed') {
            const datasetId = run.defaultDatasetId;
            const dataset = await client.dataset(datasetId).get();
            if (dataset) {
                updates.result_count = dataset.itemCount;
                // processed_count will be updated when user views results and we run regex
            }
        } else if (newStatus === 'failed') {
            updates.error_message = `Apify Run Failed: ${apifyStatus}`;
        }

        // Only update if changed
        if (newStatus !== job.status || updates.result_count !== job.result_count) {
            await supabase
                .from('marketing_scrape_jobs')
                .update(updates)
                .eq('id', job.id);
        }

    } catch (err) {
        console.error(`Error syncing job ${job.id}:`, err);
    }
}
