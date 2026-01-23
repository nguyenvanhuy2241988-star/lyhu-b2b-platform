import { ApifyClient } from 'apify-client';

// ... (existing imports)

export async function POST(request: Request) {
    try {
        // ... (existing supabase setup)

        // ... (existing auth check)

        // ... (existing body parsing)

        // ... (existing db insert)

        // 3. Call Apify
        const apifyToken = process.env.APIFY_API_TOKEN;
        if (!apifyToken) {
            throw new Error('Missing APIFY_API_TOKEN');
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
            // Non-fatal, just logging
        }

        return NextResponse.json({ success: true, job_id: job.id });

    } catch (error: any) {
        console.error('Scrape Start Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
