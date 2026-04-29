async function trigger() {
    console.log('Đang gọi API Tòa soạn Báo để ra lệnh viết bài mới...');
    try {
        const response = await fetch('https://lyhu-b2b-platform.vercel.app/api/marketing/cron/fmcg-news', {
            method: 'GET',
            headers: {
                'User-Agent': 'vercel-cron/1.0'
            }
        });
        const text = await response.text();
        console.log('Phản hồi thô:', text);
        try {
            const data = JSON.parse(text);
            console.log('Kết quả từ Bot:', data);
        } catch (err) {
            console.log('Không thể parse JSON.');
        }
    } catch (e) {
        console.error('Lỗi khi gọi API:', e);
    }
}
trigger();
