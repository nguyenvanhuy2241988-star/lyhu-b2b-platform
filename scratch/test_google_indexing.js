const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function submitUrlsToIndex() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        console.error('Missing Google credentials in .env.local');
        return;
    }

    console.log(`Connecting with Service Account: ${clientEmail}`);

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

    const urls = [
        'https://lyhu.com.vn/tin-tuc/bot-pho-mai-toan-tap-tieu-chuan-cach-dung-bang-gia',
        'https://lyhu.com.vn/tin-tuc/cach-lam-khoai-tay-lac-pho-mai-noi-chien-khong-dau-boyo-65g',
        'https://lyhu.com.vn/tin-tuc/cach-lam-bap-rang-bo-pho-mai-chuan-vi-rap-phim-boyo-65g',
        'https://lyhu.com.vn/tin-tuc/cach-lam-ga-vien-lac-pho-mai-noi-chien-khong-dau-boyo-65g',
        'https://lyhu.com.vn/tin-tuc/bot-pho-mai-boyo-65g-do-bo-ke-hang-sieu-thi-mini',
        'https://lyhu.com.vn/tin-tuc/bi-quyet-tang-doanh-so-do-an-vat-voi-bot-pho-mai-boyo',
        'https://lyhu.com.vn/tin-tuc'
    ];

    console.log(`Submitting ${urls.length} URLs to Google Indexing API...`);

    for (const url of urls) {
        try {
            const res = await indexing.urlNotifications.publish({
                requestBody: {
                    url: url,
                    type: 'URL_UPDATED',
                },
            });
            console.log(`[SUCCESS] ${url}`);
            console.log(` -> Notify time: ${res.data.urlNotificationMetadata?.latestUpdate?.notifyTime}`);
        } catch (error) {
            console.error(`[ERROR] ${url}:`, error.message);
            if (error.response?.data) {
                console.error(` -> Details:`, JSON.stringify(error.response.data));
            }
        }
    }
}

submitUrlsToIndex().catch(console.error);
