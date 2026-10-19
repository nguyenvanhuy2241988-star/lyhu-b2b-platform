export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { 
    getConnectedYouTubeAccounts, 
    removeYouTubeAccount, 
    updateYouTubeAccountBrand,
    getYouTubeAppConfig 
} from '@/lib/youtube';

export async function GET() {
    try {
        const config = await getYouTubeAppConfig();
        const isConfigured = !!(config.clientId && config.clientSecret);
        const accounts = await getConnectedYouTubeAccounts();

        const safeAccounts = accounts.map(a => ({
            channel_id: a.channel_id,
            title: a.title,
            custom_url: a.custom_url,
            avatar_url: a.avatar_url,
            brand_tag: a.brand_tag || 'Tất cả',
            connected_at: a.connected_at
        }));

        return NextResponse.json({
            isConfigured,
            connected: safeAccounts.length > 0,
            total: safeAccounts.length,
            accounts: safeAccounts
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const channelId = searchParams.get('channel_id') || undefined;
        const remaining = await removeYouTubeAccount(channelId);
        return NextResponse.json({
            success: true,
            message: channelId ? 'Đã hủy liên kết kênh YouTube đã chọn' : 'Đã ngắt kết nối toàn bộ kênh YouTube',
            remainingCount: remaining.length
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { channel_id, brand_tag } = await request.json();
        if (!channel_id || !brand_tag) {
            return NextResponse.json({ error: 'Thiếu channel_id hoặc brand_tag' }, { status: 400 });
        }
        const updated = await updateYouTubeAccountBrand(channel_id, brand_tag);
        return NextResponse.json({ success: true, accounts: updated });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
