import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

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
        const { target_url } = body;

        if (!target_url) {
            return NextResponse.json({ error: 'Missing target_url' }, { status: 400 });
        }

        // 2. Insert Job record into DB (Pending)
        const { data: job, error: dbError } = await supabase
            .from('marketing_scrape_jobs')
            .insert({
                user_id: session.user.id,
                target_url,
                status: 'pending',
                // apify_run_id will be updated after calling Apify
            })
            .select()
            .single();

        if (dbError) {
            console.error(dbError);
            return NextResponse.json({ error: 'Database Error' }, { status: 500 });
        }

        // 3. Call Apify
        const apifyToken = process.env.APIFY_API_TOKEN;
        if (!apifyToken) {
            console.error('Missing APIFY_API_TOKEN');
            // Update job to failed
            await supabase
                .from('marketing_scrape_jobs')
                .update({ status: 'failed', error_message: 'Configuration Error: Missing API Token' })
                .eq('id', job.id);
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        const client = new ApifyClient({
            token: apifyToken,
        });

        // Start the actor and don't wait for it to finish
        const run = await client.actor("apify/facebook-group-scraper").start({
            startUrls: [{ url: target_url }],
            maxItems: 50, // Limit for cost control
            proxyConfiguration: {
                useApifyProxy: true
            }
        });

        const apifyRunId = run.id;

        // 4. Update Job with Run ID and status 'running'
        const { error: updateError } = await supabase
            .from('marketing_scrape_jobs')
            .update({
                status: 'running',
                apify_run_id: apifyRunId
            })
            .eq('id', job.id);

        if (updateError) {
            console.error(updateError);
        }

        return NextResponse.json({ success: true, job_id: job.id });

    } catch (error: any) {
        console.error('Scrape Start Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
