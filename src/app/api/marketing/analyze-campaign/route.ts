import { NextResponse } from 'next/server';
import { analyzeMarketingCampaign } from '@/lib/geminiService';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        
        if (!data || !data.name) {
            return NextResponse.json({ error: 'Missing campaign data' }, { status: 400 });
        }

        const analysisResult = await analyzeMarketingCampaign(data);

        return NextResponse.json({ analysis: analysisResult });
    } catch (error: any) {
        console.error('Error analyzing campaign:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
