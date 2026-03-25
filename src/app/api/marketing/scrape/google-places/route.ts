import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Google Places API (New) - Text Search
const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

interface PlaceResult {
    id: string;
    displayName?: { text: string; languageCode: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    googleMapsUri?: string;
    rating?: number;
    userRatingCount?: number;
    types?: string[];
    businessStatus?: string;
}

export async function POST(request: Request) {
    console.log('[Google Places API] Request received');
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

        // 1. Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse body
        const body = await request.json();
        const { keywords, limit = 20 } = body;

        if (!keywords) {
            return NextResponse.json({ error: 'Missing keywords' }, { status: 400 });
        }

        // 3. Check API Key
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing GOOGLE_PLACES_API_KEY' }, { status: 500 });
        }

        // 4. Call Google Places Text Search API (New)
        console.log('[Google Places API] Searching:', keywords, 'limit:', limit);

        const fieldMask = [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.nationalPhoneNumber',
            'places.internationalPhoneNumber',
            'places.websiteUri',
            'places.googleMapsUri',
            'places.rating',
            'places.userRatingCount',
            'places.types',
            'places.businessStatus',
        ].join(',');

        const response = await fetch(GOOGLE_PLACES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask,
            },
            body: JSON.stringify({
                textQuery: keywords,
                languageCode: 'vi',
                regionCode: 'VN',
                maxResultCount: Math.min(limit, 20), // Google max is 20 per request
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Google Places API] Error:', errorData);
            return NextResponse.json({
                error: `Google API Error: ${errorData.error?.message || response.statusText}`
            }, { status: response.status });
        }

        const data = await response.json();
        const places: PlaceResult[] = data.places || [];

        console.log('[Google Places API] Found', places.length, 'results');

        // 5. Map to our result format
        const results = places.map((place, index) => ({
            id: place.id || `gp_${index}`,
            facebook_name: place.displayName?.text || 'Unknown',
            phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
            content: place.formattedAddress || '',
            address: place.formattedAddress || '',
            website: place.websiteUri || '',
            post_url: place.googleMapsUri || '',
            rating: place.rating || 0,
            reviews: place.userRatingCount || 0,
            business_status: place.businessStatus || '',
            types: place.types || [],
            is_saved: false,
        }));

        // 6. Save job to DB for history
        const { data: job } = await supabase
            .from('marketing_scrape_jobs')
            .insert({
                user_id: session.user.id,
                target_url: '',
                job_type: 'google_places_api',
                keywords,
                status: 'completed',
                result_count: results.length,
                processed_count: results.filter(r => r.phone).length,
            })
            .select()
            .single();

        return NextResponse.json({
            success: true,
            job_id: job?.id,
            results,
            total: results.length,
            with_phone: results.filter(r => r.phone).length,
        });

    } catch (error: any) {
        console.error('[Google Places API] Unexpected Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown Error' }, { status: 500 });
    }
}
