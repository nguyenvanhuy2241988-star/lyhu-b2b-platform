export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { page_token, page_id, message, image_url } = await request.json();

        if (!page_token || !page_id) {
            return NextResponse.json({ error: 'Missing page_token or page_id' }, { status: 400 });
        }

        if (!message && !image_url) {
            return NextResponse.json({ error: 'Content is empty' }, { status: 400 });
        }

        let url = '';
        let body: any = {};

        // If image exists, use /photos endpoint
        if (image_url) {
            url = `https://graph.facebook.com/v19.0/${page_id}/photos`;
            body = {
                url: image_url,
                caption: message,
                access_token: page_token
            };
        } else {
            // Text only, use /feed endpoint
            url = `https://graph.facebook.com/v19.0/${page_id}/feed`;
            body = {
                message: message,
                access_token: page_token
            };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        return NextResponse.json({ id: data.id, post_id: data.post_id || data.id });

    } catch (error: any) {
        console.error('Facebook Publish API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

