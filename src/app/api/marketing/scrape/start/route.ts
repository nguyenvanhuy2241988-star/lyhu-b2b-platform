import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    console.log('[API] Start Scrape Request received');
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
            console.log('[API] Auth failed: No session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('[API] Auth success, user:', session.user.id);

        const body = await request.json();
        const { target_url, job_type = 'fb_group', keywords, limit = 50 } = body;

        // Validation based on job type
        if (job_type === 'google_maps' && !keywords) {
            return NextResponse.json({ error: 'Missing keywords for Google Maps scrape' }, { status: 400 });
        }
        if ((job_type === 'fb_group' || job_type === 'fb_page') && !target_url) {
            return NextResponse.json({ error: 'Missing target_url' }, { status: 400 });
        }

        // 2. Insert Job record into DB (Pending)
        const { data: job, error: dbError } = await supabase
            .from('marketing_scrape_jobs')
            .insert({
                user_id: session.user.id,
                target_url: target_url || '', // Optional for maps
                job_type,
                keywords,
                status: 'pending',
                // apify_run_id will be updated after calling Apify
            })
            .select()
            .single();

        if (dbError) {
            console.error('[API] Database Insert Error:', dbError);
            return NextResponse.json({ error: 'Database Error' }, { status: 500 });
        }
        console.log('[API] Job created in DB:', job.id);

        // 3. Call Apify
        const apifyToken = process.env.APIFY_API_TOKEN;
        console.log('[API] Checking APIFY_API_TOKEN:', apifyToken ? `Present (Starts with ${apifyToken.substring(0, 4)}...)` : 'MISSING');

        if (!apifyToken) {
            console.error('Missing APIFY_API_TOKEN in process.env');
            // Update job to failed
            await supabase
                .from('marketing_scrape_jobs')
                .update({ status: 'failed', error_message: 'Configuration Error: Missing API Token' })
                .eq('id', job.id);
            return NextResponse.json({ error: 'Server Configuration Error: Missing API Token' }, { status: 500 });
        }

        const client = new ApifyClient({
            token: apifyToken,
        });

        // Start the actor and don't wait for it to finish
        console.log('[API] Starting Apify Actor for type:', job_type);
        let run;
        try {
            if (job_type === 'google_maps') {
                // Google Maps Scraper (compass/crawler-google-places)
                run = await client.actor("compass/crawler-google-places").start({
                    searchStrings: [keywords],
                    maxCrawledPlacesPerSearch: limit,
                    language: "vi",
                    countryCode: "VN",
                    proxyConfig: { useApifyProxy: true }
                });
            } else if (job_type === 'fb_page') {
                // Facebook Pages Scraper (apify/facebook-pages-scraper) - Scrapes posts/comments
                run = await client.actor("apify/facebook-pages-scraper").start({
                    startUrls: [{ url: target_url }],
                    maxPosts: 5, // Get latest posts
                    maxComments: limit, // Get comments from those posts
                    proxyConfiguration: { useApifyProxy: true }
                });
            } else {
                // Default: Facebook Groups Scraper
                run = await client.actor("apify/facebook-groups-scraper").start({
                    startUrls: [{ url: target_url }],
                    maxItems: limit,
                    proxyConfiguration: {
                        useApifyProxy: true
                    }
                });
            }

            console.log('[API] Apify Actor Started, Run ID:', run.id);
        } catch (apifyError: any) {
            console.error('[API] Apify Client Error:', apifyError);
            await supabase
                .from('marketing_scrape_jobs')
                .update({ status: 'failed', error_message: `Apify Error: ${apifyError.message}` })
                .eq('id', job.id);
            return NextResponse.json({ error: `Apify Service Error: ${apifyError.message}` }, { status: 500 });
        }

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
            console.error('[API] DB Update Error:', updateError);
        }

        return NextResponse.json({ success: true, job_id: job.id });

    } catch (error: any) {
        console.error('[API] Unexpected Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown Server Error' }, { status: 500 });
    }
}
