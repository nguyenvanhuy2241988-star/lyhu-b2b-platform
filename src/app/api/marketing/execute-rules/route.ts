import { NextResponse } from 'next/server';
import { executeFbOptimizationRule } from '@/lib/facebookAdsManager';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { accessToken, optimizations } = body;

        if (!accessToken || !Array.isArray(optimizations)) {
            return NextResponse.json({ error: 'accessToken and optimizations array are required' }, { status: 400 });
        }

        const results = [];
        for (const opt of optimizations) {
            if (opt.action === 'MAINTAIN') continue;
            
            const res = await executeFbOptimizationRule(accessToken, opt.id, opt.action, opt.current_budget);
            results.push({
                id: opt.id,
                action: opt.action,
                result: res
            });
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Execute Rules Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
