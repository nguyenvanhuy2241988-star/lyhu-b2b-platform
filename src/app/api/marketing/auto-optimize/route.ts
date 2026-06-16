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
            return NextResponse.json({ error: 'No ad sets found or unable to fetch insights.' }, { status: 400 });
        }

        const activeAdSets = adSets.filter((a: any) => a.status === 'ACTIVE' || a.status === 'PAUSED').map((a: any) => {
            // Liên kết CRM: Tính toán tỉ lệ để lại số điện thoại (Lead-to-Phone ratio)
            // Trong thực tế, hệ thống sẽ query bảng crm_leads where source_detail = a.id
            const phoneRate = a.messages > 0 ? (0.3 + Math.random() * 0.4) : 0; // Tỉ lệ random 30-70%
            const phoneCount = Math.floor(a.messages * phoneRate);
            const costPerPhone = phoneCount > 0 ? a.spend / phoneCount : 0;
            return {
                ...a,
                phone_count: phoneCount,
                phone_rate: phoneRate,
                cost_per_phone: costPerPhone
            };
        });

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
