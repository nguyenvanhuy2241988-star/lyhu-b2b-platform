export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAppSecret, saveAppSecret } from '@/lib/settingsStore';

export async function GET() {
    try {
        const creds = await getAppSecret('tiktok_credentials');
        if (!creds || !creds.access_token) {
            return NextResponse.json({ connected: false });
        }

        return NextResponse.json({
            connected: true,
            user: creds.user_info || null,
            open_id: creds.open_id,
            expires_at: creds.expires_at,
            connected_at: creds.connected_at
        });
    } catch (err: any) {
        return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await saveAppSecret('tiktok_credentials', null, undefined, 'TikTok Disconnected');
        return NextResponse.json({ success: true, message: 'Đã ngắt kết nối kênh TikTok' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
