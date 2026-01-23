import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// Vietnam Phone Regex: Starts with 03, 05, 07, 08, 09, etc. + 8 digits
const PHONE_REGEX = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/g;

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

        // 2. Fetch Job
        const { data: job, error } = await supabase
            .from('marketing_scrape_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // 3. Return Results
        let results: any[] = [];

        if (job.apify_run_id?.startsWith('mock_')) {
            // MOCK DATA
            results = Array.from({ length: job.processed_count }).map((_, i) => ({
                id: `res_${jobId}_${i}`,
                facebook_name: `User Facebook ${i + 1}`,
                facebook_id: `fb_id_${i}`,
                phone: `09${Math.floor(Math.random() * 100000000)}`,
                content: `Mình quan tâm sản phẩm này, tư vấn nhé. SĐT của mình là 09...`,
                post_url: job.target_url,
                comment_url: `${job.target_url}?comment_id=${i}`,
                is_saved: false
            }));
        } else {
            // REAL APIFY DATA
            const apifyToken = process.env.APIFY_API_TOKEN;
            if (!apifyToken) {
                return NextResponse.json({ error: 'System configuration error: Missing API Token' }, { status: 500 });
            }

            const client = new ApifyClient({ token: apifyToken });

            // Get Run to find dataset ID
            const run = await client.run(job.apify_run_id).get();
            if (run) {
                // Fetch items from default dataset
                const dataset = await client.dataset(run.defaultDatasetId).listItems();
                const items = dataset.items;

                // Process Items
                results = items.map((item: any, index: number) => {
                    // Normalize fields (different actors/scrapers use different field names)
                    const text = item.text || item.message || item.caption || item.description || '';
                    const phones = text.match(PHONE_REGEX);
                    const phone = phones ? phones[0] : null;

                    if (!phone) return null; // Filter out items without phone

                    return {
                        id: item.id || `apify_${index}`,
                        facebook_name: item.userName || item.ownerUsername || item.name || 'Unknown User',
                        facebook_id: item.userId || item.ownerId,
                        phone: phone,
                        content: text,
                        post_url: item.url || item.postUrl || job.target_url,
                        comment_url: item.url || item.postUrl, // often same as post url for scrape results
                        timestamp: item.timestamp || item.created_time,
                        is_saved: false
                    };
                }).filter(Boolean); // Remove nulls

                // Check and Update processed_count in DB if it differs from current processing
                // This ensures next time we fetch, we have accurate count
                if (results.length !== job.processed_count) {
                    await supabase
                        .from('marketing_scrape_jobs')
                        .update({ processed_count: results.length })
                        .eq('id', jobId);
                }
            }
        }

        return NextResponse.json({ results });

    } catch (error: any) {
        console.error('Fetch Results Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
