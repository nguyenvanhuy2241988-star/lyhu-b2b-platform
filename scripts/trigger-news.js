async function trigger() {
    console.log('Đang gọi API Tòa soạn Báo để ra lệnh viết bài mới...');
    try {
        const response = await fetch('https://lyhu-b2b-platform.vercel.app/api/marketing/cron/fmcg-news', {
            method: 'GET',
            headers: {
                'User-Agent': 'vercel-cron/1.0'
            }
        });
        const data = await response.json();
        console.log('Kết quả từ Bot:', data);
    } catch (e) {
        console.error('Lỗi khi gọi API:', e);
    }
}
trigger();
