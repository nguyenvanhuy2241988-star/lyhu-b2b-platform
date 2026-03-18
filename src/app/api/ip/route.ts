import { NextResponse } from 'next/server';

/**
 * GET /api/ip — Returns the client's public IP address.
 * Used by ActivityTracker to track which IP users are connecting from.
 */
export async function GET(request: Request) {
    // Vercel / Cloudflare / Nginx typically set these headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    // x-forwarded-for can be comma-separated list; first is the client IP
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';

    return NextResponse.json({ ip });
}
