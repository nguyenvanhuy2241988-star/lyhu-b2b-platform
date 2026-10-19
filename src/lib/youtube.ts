/**
 * YouTube Shorts & Video Publishing Service for LYHU App
 * Interacts with YouTube Data API v3 using Google OAuth 2.0
 */

import { google } from 'googleapis';
import { Readable } from 'stream';
import { getAppSecret, saveAppSecret } from './settingsStore';

export const DEFAULT_YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'https://www.lyhu.com.vn/api/youtube/callback';

export interface YouTubeAccount {
    channel_id: string;
    title: string;
    description?: string;
    custom_url?: string;
    avatar_url?: string;
    access_token: string;
    refresh_token: string;
    expiry_date?: number;
    connected_at: string;
    brand_tag?: string;
}

export async function getYouTubeAppConfig() {
    try {
        const config = await getAppSecret('youtube_config');
        if (config?.client_id && config?.client_secret) {
            return {
                clientId: config.client_id,
                clientSecret: config.client_secret,
                redirectUri: config.redirect_uri || DEFAULT_YOUTUBE_REDIRECT_URI
            };
        }
    } catch (e) {
        console.warn('Error fetching youtube_config:', e);
    }

    return {
        clientId: process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.YOUTUBE_REDIRECT_URI || DEFAULT_YOUTUBE_REDIRECT_URI
    };
}

export async function getYouTubeOAuthClient() {
    const config = await getYouTubeAppConfig();
    return new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        config.redirectUri
    );
}

export async function getYouTubeAuthUrl(state: string = 'lyhu_youtube_auth') {
    const oauth2Client = await getYouTubeOAuthClient();
    const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
        state
    });
}

export async function getConnectedYouTubeAccounts(): Promise<YouTubeAccount[]> {
    try {
        const accounts = await getAppSecret('youtube_accounts');
        if (Array.isArray(accounts)) {
            return accounts;
        }
    } catch (e) {
        console.warn('Error fetching youtube_accounts:', e);
    }
    return [];
}

export async function saveYouTubeAccount(account: YouTubeAccount): Promise<YouTubeAccount[]> {
    const accounts = await getConnectedYouTubeAccounts();
    const idx = accounts.findIndex(a => a.channel_id === account.channel_id);
    if (idx >= 0) {
        accounts[idx] = { 
            ...accounts[idx], 
            ...account, 
            brand_tag: accounts[idx].brand_tag || account.brand_tag || 'Tất cả' 
        };
    } else {
        accounts.push(account);
    }
    await saveAppSecret('youtube_accounts', accounts, undefined, 'Connected YouTube Channels List');
    return accounts;
}

export async function removeYouTubeAccount(channelId?: string): Promise<YouTubeAccount[]> {
    if (!channelId) {
        await saveAppSecret('youtube_accounts', [], undefined, 'Connected YouTube Channels List');
        return [];
    }
    const accounts = await getConnectedYouTubeAccounts();
    const filtered = accounts.filter(a => a.channel_id !== channelId);
    await saveAppSecret('youtube_accounts', filtered, undefined, 'Connected YouTube Channels List');
    return filtered;
}

export async function updateYouTubeAccountBrand(channelId: string, brandTag: string): Promise<YouTubeAccount[]> {
    const accounts = await getConnectedYouTubeAccounts();
    const idx = accounts.findIndex(a => a.channel_id === channelId);
    if (idx >= 0) {
        accounts[idx].brand_tag = brandTag;
        await saveAppSecret('youtube_accounts', accounts, undefined, 'Connected YouTube Channels List');
    }
    return accounts;
}

/**
 * Upload Video/Short to YouTube Channel
 */
export async function publishVideoToYouTube(
    account: YouTubeAccount,
    options: {
        title: string;
        description?: string;
        videoUrl: string;
        videoBuffer?: Buffer;
        privacyStatus?: 'public' | 'unlisted' | 'private';
    }
) {
    const config = await getYouTubeAppConfig();
    const oauth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        config.redirectUri
    );

    oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expiry_date: account.expiry_date
    });

    // Auto-update refreshed tokens
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            account.access_token = tokens.access_token;
            if (tokens.refresh_token) account.refresh_token = tokens.refresh_token;
            if (tokens.expiry_date) account.expiry_date = tokens.expiry_date;
            await saveYouTubeAccount(account);
        }
    });

    const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client
    });

    // 1. Prepare video stream buffer
    let buffer = options.videoBuffer;
    if (!buffer) {
        const res = await fetch(options.videoUrl);
        if (!res.ok) {
            throw new Error(`Không thể tải video từ URL: ${res.statusText}`);
        }
        buffer = Buffer.from(await res.arrayBuffer());
    }

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    // Title & description with #Shorts for vertical video detection
    let finalTitle = options.title.trim();
    if (!finalTitle.includes('#Shorts') && !finalTitle.includes('#shorts')) {
        finalTitle = `${finalTitle} #Shorts`;
    }

    const brand = account.brand_tag || 'LYHU';
    const finalDesc = options.description || `${options.title}\n\nĐặt hàng & Hợp tác sỉ: www.lyhu.com.vn | Hotline: 0969.83.4568\n\n#Shorts #${brand.toLowerCase().replace(/\s+/g, '')} #lyhu #hangtieudung #kinhdoanh`;

    // 2. Insert video to YouTube
    const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: finalTitle,
                description: finalDesc,
                tags: ['Shorts', 'LYHU', brand, 'FMCG', 'kinh doanh', 'hang tieu dung'],
                categoryId: '22' // People & Blogs
            },
            status: {
                privacyStatus: options.privacyStatus || 'public',
                selfDeclaredMadeForKids: false
            }
        },
        media: {
            body: readableStream
        }
    });

    const videoId = response.data.id;
    if (!videoId) {
        throw new Error('YouTube không trả về video ID');
    }

    return {
        success: true,
        channel_id: account.channel_id,
        channel_title: account.title,
        video_id: videoId,
        url: `https://youtube.com/shorts/${videoId}`
    };
}
