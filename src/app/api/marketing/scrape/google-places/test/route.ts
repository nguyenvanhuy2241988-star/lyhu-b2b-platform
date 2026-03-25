import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Test Google Places API connection and show diagnostic info
export async function GET() {
    try {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        
        if (!apiKey) {
            return NextResponse.json({
                connected: false,
                error: 'GOOGLE_PLACES_API_KEY chưa được cấu hình trong Environment Variables',
                key_preview: null,
            });
        }

        const keyPreview = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);

        // Test with a simple search to validate the key
        const testUrl = 'https://places.googleapis.com/v1/places:searchText';
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.displayName',
            },
            body: JSON.stringify({
                textQuery: 'test',
                maxResultCount: 1,
                languageCode: 'vi',
                regionCode: 'VN',
            }),
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
                connected: true,
                key_preview: keyPreview,
                status: response.status,
                results_count: data.places?.length || 0,
                message: '✅ Kết nối Google Places API thành công!',
            });
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;
            const errorStatus = errorData.error?.status || '';
            
            let diagnosis = '';
            if (response.status === 403) {
                if (errorMessage.includes('not enabled') || errorMessage.includes('has not been used')) {
                    diagnosis = '❌ Places API (New) chưa được BẬT trong project. Vào Google Cloud Console → Thư viện → Địa điểm API → Bật';
                } else if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
                    diagnosis = '❌ API Key không hợp lệ. Kiểm tra lại key trong Vercel Environment Variables';
                } else if (errorMessage.includes('billing') || errorMessage.includes('BILLING')) {
                    diagnosis = '❌ Tài khoản thanh toán chưa được liên kết với project chứa API Key';
                } else {
                    diagnosis = '❌ Quyền truy cập bị từ chối. Có thể API Key thuộc project khác với project đã bật Places API';
                }
            } else if (response.status === 400) {
                diagnosis = '⚠️ Yêu cầu không hợp lệ - có thể API phiên bản cũ';
            }

            return NextResponse.json({
                connected: false,
                key_preview: keyPreview,
                status: response.status,
                error: errorMessage,
                error_status: errorStatus,
                diagnosis,
                raw_error: errorData,
            });
        }

    } catch (error: any) {
        return NextResponse.json({
            connected: false,
            error: error.message || 'Lỗi không xác định',
            diagnosis: '❌ Không thể kết nối tới Google API',
        });
    }
}
