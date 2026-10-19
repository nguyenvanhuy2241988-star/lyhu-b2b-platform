export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const rawFilename = searchParams.get('filename') || 'video_lyhu.mp4';
    const safeFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!fileUrl) {
        return new NextResponse('Missing file url parameter', { status: 400 });
    }

    try {
        const res = await fetch(fileUrl);
        if (!res.ok) {
            return new NextResponse(`Lỗi tải video từ nguồn: ${res.statusText}`, { status: res.status });
        }

        const headers = new Headers();
        headers.set('Content-Type', res.headers.get('content-type') || 'video/mp4');
        headers.set('Content-Disposition', `attachment; filename="${safeFilename}"`);
        const length = res.headers.get('content-length');
        if (length) {
            headers.set('Content-Length', length);
        }

        return new NextResponse(res.body, {
            status: 200,
            headers
        });
    } catch (err: any) {
        console.error('Media download proxy error:', err);
        return new NextResponse(err.message || 'Lỗi server khi tải file', { status: 500 });
    }
}
