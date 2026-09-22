import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (token !== 'lyhu_clean_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!clientEmail || !privateKey) {
            return NextResponse.json({ error: "Thiếu cấu hình GOOGLE_CLIENT_EMAIL hoặc GOOGLE_PRIVATE_KEY" }, { status: 500 });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        const indexing = google.indexing({
            version: 'v3',
            auth: auth,
        });

        const defaultUrls = [
            'https://lyhu.com.vn/tin-tuc/bot-pho-mai-toan-tap-tieu-chuan-cach-dung-bang-gia',
            'https://lyhu.com.vn/tin-tuc/cach-lam-khoai-tay-lac-pho-mai-noi-chien-khong-dau-boyo-65g',
            'https://lyhu.com.vn/tin-tuc/cach-lam-bap-rang-bo-pho-mai-chuan-vi-rap-phim-boyo-65g',
            'https://lyhu.com.vn/tin-tuc/cach-lam-ga-vien-lac-pho-mai-noi-chien-khong-dau-boyo-65g',
            'https://lyhu.com.vn/tin-tuc/bot-pho-mai-boyo-65g-do-bo-ke-hang-sieu-thi-mini',
            'https://lyhu.com.vn/tin-tuc/bi-quyet-tang-doanh-so-do-an-vat-voi-bot-pho-mai-boyo',
            'https://lyhu.com.vn/tin-tuc'
        ];

        // Cho phép truyền thêm param url nếu muốn index 1 url cụ thể
        const targetUrl = req.nextUrl.searchParams.get('url');
        const urlsToIndex = targetUrl ? [targetUrl] : defaultUrls;

        const results = [];

        for (const url of urlsToIndex) {
            try {
                const response = await indexing.urlNotifications.publish({
                    requestBody: {
                        url: url,
                        type: 'URL_UPDATED',
                    },
                });

                results.push({
                    url,
                    status: 'SUCCESS',
                    notifyTime: response.data.urlNotificationMetadata?.latestUpdate?.notifyTime || new Date().toISOString()
                });
            } catch (err: any) {
                results.push({
                    url,
                    status: 'ERROR',
                    error: err.message,
                    details: err.response?.data?.error || null
                });
            }
        }

        return NextResponse.json({
            success: true,
            total: urlsToIndex.length,
            results
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
