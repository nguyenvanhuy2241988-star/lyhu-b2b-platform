import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return new NextResponse('Failed to fetch image', { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        const headers = new Headers(response.headers);
        
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('OG Image Proxy Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
