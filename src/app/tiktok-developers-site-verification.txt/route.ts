export const dynamic = 'force-dynamic';

export async function GET() {
    return new Response('tiktok-developers-site-verification=O9TfbB9JATCsIRwo5GRvDhsA6L825K0I', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store'
        }
    });
}
