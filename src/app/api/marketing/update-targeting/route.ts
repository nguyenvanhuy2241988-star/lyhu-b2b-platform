import { NextResponse } from 'next/server';
import { searchFbInterests, updateFbAdSetTargeting } from '@/lib/facebookAdsManager';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { adSetId, keywords, accessToken } = body;

        if (!adSetId || !keywords || !Array.isArray(keywords)) {
            return NextResponse.json({ error: 'adSetId and keywords array are required' }, { status: 400 });
        }

        if (!accessToken) {
            return NextResponse.json({ error: 'Facebook accessToken required' }, { status: 401 });
        }
        
        const fbToken = accessToken;

        // 1. Search for each keyword
        let validInterests: any[] = [];
        for (const kw of keywords) {
            // Trim and clean
            const cleanKw = kw.trim();
            if (!cleanKw) continue;
            
            const results = await searchFbInterests(fbToken, cleanKw);
            if (results && results.length > 0) {
                // Get the most relevant match (usually the first one)
                validInterests.push({
                    id: results[0].id,
                    name: results[0].name
                });
            }
        }

        // Remove duplicates just in case
        const uniqueInterests = Array.from(new Map(validInterests.map(item => [item.id, item])).values());

        if (uniqueInterests.length === 0) {
            return NextResponse.json({ error: 'Could not find any matching Facebook Interests for the provided keywords' }, { status: 400 });
        }

        // 2. Update AdSet
        const updateResult = await updateFbAdSetTargeting(fbToken, adSetId, uniqueInterests);

        return NextResponse.json({ 
            success: true, 
            message: `Successfully applied ${uniqueInterests.length} interests to Ad Set.`,
            appliedInterests: uniqueInterests 
        });

    } catch (error: any) {
        console.error('Update Targeting Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
