export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;

export async function POST(request: Request) {
    try {
        const { short_token } = await request.json();

        if (!short_token) {
            return NextResponse.json({ error: 'Missing short_token' }, { status: 400 });
        }

        if (!FB_APP_ID || !FB_APP_SECRET) {
            return NextResponse.json({ error: 'Missing Server Configuration (App ID/Secret)' }, { status: 500 });
        }

        // 0. Debug: Check what permissions the SHORT-LIVED token actually has
        const debugShortUrl = `https://graph.facebook.com/v19.0/debug_token?input_token=${short_token}&access_token=${FB_APP_ID}|${FB_APP_SECRET}`;
        const debugShortRes = await fetch(debugShortUrl);
        const debugShortData = await debugShortRes.json();
        const shortTokenScopes = debugShortData.data?.scopes || [];

        // 1. Exchange for Long-Lived User Token
        const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${short_token}`;

        const exchangeRes = await fetch(exchangeUrl);
        const exchangeData = await exchangeRes.json();

        if (exchangeData.error) {
            return NextResponse.json({ error: exchangeData.error.message }, { status: 400 });
        }

        const longUserToken = exchangeData.access_token;

        // Debug: Check long-lived token permissions
        const debugLongUrl = `https://graph.facebook.com/v19.0/debug_token?input_token=${longUserToken}&access_token=${FB_APP_ID}|${FB_APP_SECRET}`;
        const debugLongRes = await fetch(debugLongUrl);
        const debugLongData = await debugLongRes.json();
        const longTokenScopes = debugLongData.data?.scopes || [];

        // 2. Get User's Pages (ID, Name, Page Access Token, Picture)
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${longUserToken}&fields=id,name,access_token,category,picture{url}`;

        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();

        if (pagesData.error) {
            return NextResponse.json({ error: pagesData.error.message }, { status: 400 });
        }

        // Debug: Check FIRST page token permissions  
        let pageTokenScopes: string[] = [];
        if (pagesData.data?.[0]?.access_token) {
            const debugPageUrl = `https://graph.facebook.com/v19.0/debug_token?input_token=${pagesData.data[0].access_token}&access_token=${FB_APP_ID}|${FB_APP_SECRET}`;
            const debugPageRes = await fetch(debugPageUrl);
            const debugPageData = await debugPageRes.json();
            pageTokenScopes = debugPageData.data?.scopes || [];
        }

        // Return both: page tokens (for posts) + user token (for comments)
        const pages = pagesData.data.map((page: any) => ({
            page_id: page.id,
            name: page.name,
            access_token: page.access_token, // Page token for reading posts
            category: page.category,
            avatar_url: page.picture?.data?.url
        }));

        return NextResponse.json({
            pages,
            user_token: longUserToken,
            token_debug: {
                short_token_scopes: shortTokenScopes,
                long_token_scopes: longTokenScopes,
                page_token_scopes: pageTokenScopes,
                has_pages_read_engagement: {
                    short: shortTokenScopes.includes('pages_read_engagement'),
                    long: longTokenScopes.includes('pages_read_engagement'),
                    page: pageTokenScopes.includes('pages_read_engagement'),
                }
            }
        });

    } catch (error: any) {
        console.error('Facebook Auth API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

