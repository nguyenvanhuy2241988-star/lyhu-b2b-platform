/**
 * Cron Job: Process queued marketing leads
 * Runs every 2 minutes via Vercel Cron
 * Assigns pending leads to online telesales
 */

import { NextResponse } from 'next/server';
import { processQueuedLeads } from '@/lib/leadDistributionService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
    // Verify cron secret (Vercel sends this header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const assigned = await processQueuedLeads();
        return NextResponse.json({
            ok: true,
            assigned,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Cron] Lead distribution error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
