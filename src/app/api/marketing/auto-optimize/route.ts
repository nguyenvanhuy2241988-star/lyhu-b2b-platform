import { NextResponse } from 'next/server';
import { fetchAllAdSetsWithInsights } from '@/lib/facebookAdsManager';
import { autoOptimizeMarketingCampaigns } from '@/lib/geminiService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { accessToken, adAccountId } = body;

        if (!accessToken || !adAccountId) {
            console.warn("No accessToken or adAccountId, but proceeding with mock data");
        }

        // 1. Fetch all active ad sets with insights
        const adSets = await fetchAllAdSetsWithInsights(accessToken, adAccountId);
        
        if (!adSets || adSets.length === 0) {
            return NextResponse.json({ 
                success: true, 
                data: [],
                rawAdSets: []
            });
        }

        const activeAdSets = adSets.map((a: any) => {
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

        const validAdSets = activeAdSets.filter((a: any) => a.spend > 0 || a.messages > 0);
        const zeroAdSets = activeAdSets.filter((a: any) => a.spend === 0 && a.messages === 0);

        // 2. Pass to AI Media Buyer ONLY for ad sets that have data
        const aiRecommendations = validAdSets.length > 0 
            ? await autoOptimizeMarketingCampaigns(validAdSets) 
            : [];

        // 3. Combine AI recommendations with local auto-maintain for zero spend ad sets
        const recommendations = [
            ...aiRecommendations,
            ...zeroAdSets.map((a: any) => ({
                id: a.id,
                name: a.name,
                action: "MAINTAIN",
                reason: "Chưa đủ dữ liệu (0đ / 0 tin nhắn)."
            }))
        ];

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
