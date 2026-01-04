
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'bot-crawler-link-preview', // Identify as a bot/browser to avoid some blocks
            },
            signal: AbortSignal.timeout(5000), // 5s timeout
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch url' }, { status: response.status });
        }

        const html = await response.text();

        // Basic Regex Parsing for OpenGraph and Standard Meta tags
        const getMetaTag = (prop: string) => {
            const regex = new RegExp(`<meta (?:property|name)=["']${prop}["'] content=["']([^"']+)["']`, 'i');
            const match = html.match(regex);
            return match ? match[1] : null;
        };

        const getTitle = () => {
            const ogTitle = getMetaTag('og:title');
            if (ogTitle) return ogTitle;
            const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
            return titleMatch ? titleMatch[1] : null;
        };

        const getDescription = () => {
            return getMetaTag('og:description') || getMetaTag('description');
        };

        const getImage = () => {
            return getMetaTag('og:image');
        };

        const getSiteName = () => {
            return getMetaTag('og:site_name');
        };

        const title = getTitle();
        const description = getDescription();
        const image = getImage();
        const siteName = getSiteName();
        const domain = new URL(targetUrl).hostname;

        if (!title && !description && !image) {
            return NextResponse.json({ error: 'No metadata found' }, { status: 404 });
        }

        return NextResponse.json({
            title: title || domain,
            description,
            image,
            siteName: siteName || domain,
            url: targetUrl
        });

    } catch (error) {
        console.error('OG Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
