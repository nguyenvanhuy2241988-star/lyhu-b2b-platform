import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from 'next/server';

// Temporary Mock for Apify to avoid needing API Key immediately during dev
// In production, this would use ApifyClient
const MOCK_APIFY = true;

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
                // apify_run_id: ... (will set this after calling Apify)
            })
            .select()
            .single();

        if (dbError) {
            console.error(dbError);
            return NextResponse.json({ error: 'Database Error' }, { status: 500 });
        }

        // 3. Call Apify (or Mock)
        // Note: For real implementation, npm install apify-client
        let apifyRunId = `mock_run_${Date.now()}`;

        if (!MOCK_APIFY) {
            // Real implementation would go here
            // const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
            // const run = await client.actor("apify/facebook-group-scraper").call({ startUrls: [{ url: target_url }] });
            // apifyRunId = run.id;
        } else {
            // Simulate starting a job
            // In a real scenario, we might use a background worker or webhook for completion.
            // For this MVP, we just acknowledge the start.
        }

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
            // Non-fatal, just logging
        }

        return NextResponse.json({ success: true, job_id: job.id });

    } catch (error: any) {
        console.error('Scrape Start Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
