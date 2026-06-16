import { NextResponse } from 'next/server';
import { generateAdCopyAndTargeting } from '@/lib/geminiService';
import { supabase } from '@/lib/supabaseClient';
// import { searchFbInterests } from '@/lib/facebookAdsManager';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { goal, budget, audience } = body;

        if (!goal || !budget || !audience) {
            return NextResponse.json({ error: 'Thiếu thông tin mục tiêu, ngân sách hoặc khách hàng' }, { status: 400 });
        }

        // 1. Fetch random image from Media Library
        const { data: mediaFiles } = await supabase
            .from('bot_contents')
            .select('image_url')
            .not('image_url', 'is', null)
            .limit(10);
            
        let selectedImage = null;
        if (mediaFiles && mediaFiles.length > 0) {
            // Pick a random image from library
            selectedImage = mediaFiles[Math.floor(Math.random() * mediaFiles.length)].image_url;
        }

        // 2. AI Generates Content and Targeting
        const aiPlan = await generateAdCopyAndTargeting(goal, audience);

        // 3. (Mock) Create FB Campaign Draft
        // In a real scenario, we would download the selectedImage, 
        // call FB API to create Campaign -> AdSet (PAUSED/DRAFT) -> AdCreative -> Ad.
        console.log("Mock creating FB Campaign Draft with image:", selectedImage);
        console.log("Ad Copy:", aiPlan.ad_copy);
        console.log("Targeting:", aiPlan.targeting_keywords);

        // Simulated delay for "API Call"
        await new Promise(resolve => setTimeout(resolve, 2000));

        return NextResponse.json({ 
            success: true, 
            message: 'Đã tạo thành công Bản Nháp!',
            plan: aiPlan,
            selected_image: selectedImage
        });

    } catch (error: any) {
        console.error('Generate Campaign Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
