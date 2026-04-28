export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * GET /api/ip â€” Returns the client's public IP address.
 * Used by ActivityTracker to track which IP users are connecting from.
 */
export async function GET(request: Request) {
    // Vercel / Cloudflare / Nginx typically set these headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    let ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
    ip = ip.replace(/^::ffff:/, '');

    return NextResponse.json({ ip });
}

