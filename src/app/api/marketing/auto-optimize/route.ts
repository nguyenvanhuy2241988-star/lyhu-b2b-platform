import { NextResponse } from 'next/server';
import { fetchAllAdSetsWithInsights } from '@/lib/facebookAdsManager';
import { autoOptimizeMarketingCampaigns } from '@/lib/geminiService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { accessToken, adAccountId } = body;

        if (!accessToken || !adAccountId) {
            return NextResponse.json({ error: 'accessToken and adAccountId are required' }, { status: 400 });
        }

        // 1. Fetch all active ad sets with insights
        const adSets = await fetchAllAdSetsWithInsights(accessToken, adAccountId);
        
        if (!adSets || adSets.length === 0) {
            return NextResponse.json({ error: 'No ad sets found or unable to fetch insights.' }, { status: 404 });
        }

        const activeAdSets = adSets.filter(a => a.status === 'ACTIVE' || a.status === 'PAUSED');

        // 2. Pass to AI Media Buyer
        const recommendations = await autoOptimizeMarketingCampaigns(activeAdSets);

        return NextResponse.json({ 
            success: true, 
            data: recommendations,
            rawAdSets: activeAdSets 
        });

    } catch (error: any) {
        console.error('Auto Optimize Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
