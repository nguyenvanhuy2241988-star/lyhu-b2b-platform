export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getConnectedTikTokAccounts, removeTikTokAccount, updateTikTokAccountBrand } from '@/lib/tiktok';

export async function GET() {
    try {
        const accounts = await getConnectedTikTokAccounts();
        if (!accounts || accounts.length === 0) {
            return NextResponse.json({ connected: false, total: 0, accounts: [] });
        }

        const safeAccounts = accounts.map(a => ({
            open_id: a.open_id,
            union_id: a.union_id,
            display_name: a.display_name,
            avatar_url: a.avatar_url,
            brand_tag: a.brand_tag || 'Tất cả',
            connected_at: a.connected_at,
            expires_at: a.expires_at
        }));

        return NextResponse.json({
            connected: true,
            total: safeAccounts.length,
            accounts: safeAccounts,
            user: safeAccounts[0],
            open_id: safeAccounts[0].open_id
        });
    } catch (err: any) {
        return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const openId = url.searchParams.get('open_id') || undefined;
        const remaining = await removeTikTokAccount(openId);
        return NextResponse.json({ 
            success: true, 
            message: openId ? 'Đã hủy kết nối kênh TikTok đã chọn' : 'Đã ngắt kết nối toàn bộ kênh TikTok',
            remainingCount: remaining.length
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { open_id, brand_tag } = body;
        if (!open_id || !brand_tag) {
            return NextResponse.json({ error: 'Thiếu open_id hoặc brand_tag' }, { status: 400 });
        }
        const updated = await updateTikTokAccountBrand(open_id, brand_tag);
        return NextResponse.json({ success: true, message: 'Đã cập nhật thương hiệu kênh', total: updated.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
