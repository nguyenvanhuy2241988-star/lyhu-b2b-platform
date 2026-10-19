export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getConnectedFacebookPages, updateFacebookPageBrand } from '@/lib/facebookPublisher';

export async function GET() {
    try {
        const pages = await getConnectedFacebookPages();
        return NextResponse.json({
            connected: pages.length > 0,
            total: pages.length,
            pages
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { page_id, brand_tag } = await request.json();
        if (!page_id || !brand_tag) {
            return NextResponse.json({ error: 'Thiếu page_id hoặc brand_tag' }, { status: 400 });
        }
        const ok = await updateFacebookPageBrand(page_id, brand_tag);
        return NextResponse.json({ success: ok });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
