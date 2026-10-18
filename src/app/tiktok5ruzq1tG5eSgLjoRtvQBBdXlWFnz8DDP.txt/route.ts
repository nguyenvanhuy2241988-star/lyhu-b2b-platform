export const dynamic = 'force-dynamic';

export async function GET() {
    return new Response('tiktok-developers-site-verification=qaTOXKjw1eQjWD2oHbxPVPFlrSLW3nR9', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store'
        }
    });
}
