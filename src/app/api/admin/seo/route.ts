import { NextResponse } from "next/server";
import { google } from "googleapis";
import dayjs from "dayjs";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!clientEmail || !privateKey) {
            return NextResponse.json({ error: "Thiếu cấu hình Google API (GOOGLE_CLIENT_EMAIL hoặc GOOGLE_PRIVATE_KEY)" }, { status: 500 });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
        });

        const searchconsole = google.searchconsole({
            version: 'v1',
            auth: auth,
        });

        // Đổi sang URL prefix thay vì Domain property để vượt lỗi GSC
        const siteUrl = "https://lyhu.com.vn/";

        const endDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD'); 
        const startDate = dayjs().subtract(31, 'days').format('YYYY-MM-DD');

        const response = await searchconsole.searchanalytics.query({
            siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions: ['date'],
            },
        });

        const rows = response.data.rows || [];
        
        let totalClicks = 0;
        let totalImpressions = 0;
        let totalPosition = 0;

        rows.forEach(row => {
            totalClicks += row.clicks || 0;
            totalImpressions += row.impressions || 0;
            totalPosition += (row.position || 0) * (row.impressions || 0);
        });

        const avgPosition = totalImpressions > 0 ? totalPosition / totalImpressions : 0;
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

        return NextResponse.json({
            clicks: totalClicks,
            impressions: totalImpressions,
            ctr: ctr,
            position: avgPosition,
            days: 30,
            hasData: rows.length > 0
        });

    } catch (error: any) {
        console.error("Lỗi khi kết nối Google Search Console:", error);
        
        // Handle specific google API errors
        if (error.code === 403) {
            return NextResponse.json({ 
                error: "Không có quyền truy cập. Vui lòng đảm bảo bạn đã thêm Email của Service Account vào Google Search Console với quyền Đầy đủ." 
            }, { status: 403 });
        }
        
        return NextResponse.json({ 
            error: error.message || "Đã xảy ra lỗi khi kết nối với Google Search Console" 
        }, { status: 500 });
    }
}
