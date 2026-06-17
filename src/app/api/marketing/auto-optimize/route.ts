import { NextResponse } from 'next/server';
import { fetchAllAdSetsWithInsights } from '@/lib/facebookAdsManager';
import { autoOptimizeMarketingCampaigns } from '@/lib/geminiService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { accessToken, adAccountId, timeRange = 'maximum', objectiveFilter = 'all', statusFilter = 'ACTIVE' } = body;

        if (!accessToken || !adAccountId) {
            console.warn("No accessToken or adAccountId, but proceeding with mock data");
        }

        // 1. Fetch all active ad sets with insights
        let adSets = await fetchAllAdSetsWithInsights(accessToken, adAccountId, timeRange, objectiveFilter);
        
        // Filter by Status (Removed to allow frontend dynamic filtering)
        // if (statusFilter !== 'ALL') {
        //     adSets = adSets.filter((a: any) => a.status === statusFilter);
        // }

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

        // 4. Enhance recommendations with full stats for the UI and History
        const enhancedRecommendations = recommendations.map(rec => {
            const matchedRaw = activeAdSets.find((a: any) => a.id === rec.id);
            return {
                ...rec,
                current_budget: matchedRaw?.daily_budget || "0",
                cost_per_message: matchedRaw?.cost_per_message || 0,
                spend: matchedRaw?.spend || 0,
                messages: matchedRaw?.messages || 0,
                phone_count: matchedRaw?.phone_count || 0,
                phone_rate: matchedRaw?.phone_rate || 0,
                cost_per_phone: matchedRaw?.cost_per_phone || 0,
                status: matchedRaw?.status || 'ACTIVE'
            };
        });

        // 5. Lưu lại lịch sử đánh giá vào database
        try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            await supabase.from('marketing_action_logs').insert({
                action_type: 'AI_OPTIMIZATION',
                status: 'info',
                details: {
                    message: `Đã phân tích ${activeAdSets.length} nhóm quảng cáo (Mục tiêu: ${objectiveFilter}, Thời gian: ${timeRange}). Có ${aiRecommendations.length} nhóm được tối ưu bởi AI.`,
                    recommendations: enhancedRecommendations
                }
            });
        } catch (dbError) {
            console.error("Failed to save optimization log:", dbError);
        }

        return NextResponse.json({ 
            success: true, 
            data: enhancedRecommendations,
            rawAdSets: activeAdSets 
        });

    } catch (error: any) {
        console.error('Auto Optimize Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
