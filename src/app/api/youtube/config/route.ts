export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAppSecret, saveAppSecret } from '@/lib/settingsStore';
import { DEFAULT_YOUTUBE_REDIRECT_URI } from '@/lib/youtube';

export async function GET() {
    try {
        const config = await getAppSecret('youtube_config');
        return NextResponse.json({
            isConfigured: !!(config?.client_id && config?.client_secret),
            client_id: config?.client_id ? `${config.client_id.slice(0, 15)}...` : '',
            redirect_uri: config?.redirect_uri || DEFAULT_YOUTUBE_REDIRECT_URI
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { client_id, client_secret, redirect_uri } = await request.json();

        if (!client_id || !client_secret) {
            return NextResponse.json({ error: 'Vui lòng cung cấp đầy đủ Client ID và Client Secret' }, { status: 400 });
        }

        const config = {
            client_id: client_id.trim(),
            client_secret: client_secret.trim(),
            redirect_uri: (redirect_uri || DEFAULT_YOUTUBE_REDIRECT_URI).trim()
        };

        await saveAppSecret('youtube_config', config, undefined, 'Google YouTube OAuth App Credentials');

        return NextResponse.json({
            success: true,
            message: 'Đã lưu cấu hình Google YouTube App thành công!'
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
