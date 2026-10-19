/**
 * TikTok Content Posting API v2 Client for LYHU App
 * Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
 */

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

import { getAppSecret, saveAppSecret } from './settingsStore';

export const DEFAULT_TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || 'sbawg088v4f5jy9mh9';
export const DEFAULT_TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || 'E8YQ0B80E0d6977gA9WvafLvlKSSTgnL';
export const DEFAULT_TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://www.lyhu.com.vn/api/tiktok/callback';

export async function getTikTokAppConfig() {
    try {
        const config = await getAppSecret('tiktok_config');
        if (config?.client_key && config?.client_secret) {
            return {
                clientKey: config.client_key,
                clientSecret: config.client_secret,
                redirectUri: config.redirect_uri || DEFAULT_TIKTOK_REDIRECT_URI
            };
        }
    } catch (e) {
        console.warn('Could not read tiktok_config from app_secrets:', e);
    }
    return {
        clientKey: DEFAULT_TIKTOK_CLIENT_KEY,
        clientSecret: DEFAULT_TIKTOK_CLIENT_SECRET,
        redirectUri: DEFAULT_TIKTOK_REDIRECT_URI
    };
}

export interface TikTokAccount {
    open_id: string;
    union_id?: string;
    display_name: string;
    avatar_url?: string;
    access_token: string;
    refresh_token: string;
    expires_at: number;
    refresh_expires_at: number;
    scope: string;
    connected_at: string;
    brand_tag?: string;
}

export async function getConnectedTikTokAccounts(): Promise<TikTokAccount[]> {
    try {
        const accounts = await getAppSecret('tiktok_accounts');
        if (Array.isArray(accounts) && accounts.length > 0) {
            return accounts;
        }
        // Fallback to legacy single account
        const creds = await getAppSecret('tiktok_credentials');
        if (creds?.access_token && creds?.open_id) {
            return [{
                open_id: creds.open_id,
                union_id: creds.user_info?.union_id,
                display_name: creds.user_info?.display_name || 'Kênh TikTok',
                avatar_url: creds.user_info?.avatar_url,
                access_token: creds.access_token,
                refresh_token: creds.refresh_token,
                expires_at: creds.expires_at,
                refresh_expires_at: creds.refresh_expires_at,
                scope: creds.scope || '',
                connected_at: creds.connected_at || new Date().toISOString(),
                brand_tag: 'LYHU'
            }];
        }
    } catch (e) {
        console.warn('Error fetching tiktok_accounts:', e);
    }
    return [];
}

export async function saveTikTokAccount(account: TikTokAccount): Promise<TikTokAccount[]> {
    const accounts = await getConnectedTikTokAccounts();
    const idx = accounts.findIndex(a => a.open_id === account.open_id);
    if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], ...account };
    } else {
        accounts.push(account);
    }
    await saveAppSecret('tiktok_accounts', accounts, undefined, 'Connected TikTok Multi-Channels List');
    if (accounts.length > 0) {
        const primary = accounts[0];
        await saveAppSecret('tiktok_credentials', {
            access_token: primary.access_token,
            refresh_token: primary.refresh_token,
            expires_at: primary.expires_at,
            refresh_expires_at: primary.refresh_expires_at,
            open_id: primary.open_id,
            scope: primary.scope,
            connected_at: primary.connected_at,
            user_info: {
                open_id: primary.open_id,
                union_id: primary.union_id,
                display_name: primary.display_name,
                avatar_url: primary.avatar_url
            }
        }, undefined, 'TikTok Creator OAuth Credentials');
    }
    return accounts;
}

export async function removeTikTokAccount(openId?: string): Promise<TikTokAccount[]> {
    if (!openId) {
        await saveAppSecret('tiktok_accounts', [], undefined, 'Connected TikTok Multi-Channels List');
        await saveAppSecret('tiktok_credentials', null, undefined, 'TikTok Disconnected');
        return [];
    }
    const accounts = await getConnectedTikTokAccounts();
    const filtered = accounts.filter(a => a.open_id !== openId);
    await saveAppSecret('tiktok_accounts', filtered, undefined, 'Connected TikTok Multi-Channels List');
    if (filtered.length > 0) {
        const primary = filtered[0];
        await saveAppSecret('tiktok_credentials', {
            access_token: primary.access_token,
            refresh_token: primary.refresh_token,
            expires_at: primary.expires_at,
            refresh_expires_at: primary.refresh_expires_at,
            open_id: primary.open_id,
            scope: primary.scope,
            connected_at: primary.connected_at,
            user_info: {
                open_id: primary.open_id,
                union_id: primary.union_id,
                display_name: primary.display_name,
                avatar_url: primary.avatar_url
            }
        }, undefined, 'TikTok Creator OAuth Credentials');
    } else {
        await saveAppSecret('tiktok_credentials', null, undefined, 'TikTok Disconnected');
    }
    return filtered;
}

export async function updateTikTokAccountBrand(openId: string, brandTag: string): Promise<TikTokAccount[]> {
    const accounts = await getConnectedTikTokAccounts();
    const idx = accounts.findIndex(a => a.open_id === openId);
    if (idx >= 0) {
        accounts[idx].brand_tag = brandTag;
        await saveAppSecret('tiktok_accounts', accounts, undefined, 'Connected TikTok Multi-Channels List');
    }
    return accounts;
}

export interface TikTokTokenResponse {
    access_token: string;
    expires_in: number;
    open_id: string;
    refresh_token: string;
    refresh_expires_in: number;
    scope: string;
    token_type: string;
    error?: string;
    error_description?: string;
}

export interface TikTokPublishOptions {
    title: string;
    videoUrl?: string;
    videoBuffer?: Buffer;
    privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';
    disableDuet?: boolean;
    disableStitch?: boolean;
    disableComment?: boolean;
    videoCoverTimestampMs?: number;
    autoAddMusic?: boolean;
}

/**
 * 1. Generate TikTok Authorization URL
 */
export function getTikTokAuthUrl(clientKey: string, redirectUri: string, state: string = 'lyhu_tiktok_auth') {
    const scopes = ['user.info.basic', 'video.publish'].join(',');
    const params = new URLSearchParams({
        client_key: clientKey,
        scope: scopes,
        response_type: 'code',
        redirect_uri: redirectUri,
        state: state
    });

    return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

/**
 * 2. Exchange authorization code for Access Token & Refresh Token
 */
export async function exchangeCodeForTikTokToken(
    code: string,
    clientKey: string,
    clientSecret: string,
    redirectUri: string
): Promise<TikTokTokenResponse> {
    const params = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
    });

    const res = await fetch(TIKTOK_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
        },
        body: params.toString()
    });

    const data = await res.json();
    return data;
}

/**
 * 3. Refresh Access Token using Refresh Token
 */
export async function refreshTikTokToken(
    refreshToken: string,
    clientKey: string,
    clientSecret: string
): Promise<TikTokTokenResponse> {
    const params = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });

    const res = await fetch(TIKTOK_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
        },
        body: params.toString()
    });

    return await res.json();
}

/**
 * 4. Get User Profile info
 */
export async function getTikTokUserInfo(accessToken: string) {
    const fields = 'open_id,union_id,avatar_url,display_name';
    const res = await fetch(`${TIKTOK_API_BASE}/user/info/?fields=${fields}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    return await res.json();
}

/**
 * 5. Publish video using FILE_UPLOAD (Bypasses TikTok domain verification requirement)
 */
export async function publishVideoFromFileUpload(accessToken: string, options: TikTokPublishOptions) {
    let videoBuffer: Buffer;
    if (options.videoBuffer) {
        videoBuffer = options.videoBuffer;
    } else {
        if (!options.videoUrl) {
            throw new Error('Video URL hoặc videoBuffer là bắt buộc để upload.');
        }
        const videoRes = await fetch(options.videoUrl);
        if (!videoRes.ok) {
            throw new Error(`Không thể tải video từ URL: ${videoRes.statusText}`);
        }
        const arrayBuffer = await videoRes.arrayBuffer();
        videoBuffer = Buffer.from(arrayBuffer);
    }
    const videoSize = videoBuffer.byteLength;

    let targetPrivacy = options.privacyLevel || 'SELF_ONLY';

    // 2. Khởi tạo upload với source: FILE_UPLOAD
    const makeInitRequest = async (privacy: string) => {
        const payload = {
            post_info: {
                title: options.title,
                privacy_level: privacy,
                disable_duet: options.disableDuet ?? false,
                disable_stitch: options.disableStitch ?? false,
                disable_comment: options.disableComment ?? false,
                video_cover_timestamp_ms: options.videoCoverTimestampMs || 1000
            },
            source_info: {
                source: 'FILE_UPLOAD',
                video_size: videoSize,
                chunk_size: videoSize,
                total_chunk_count: 1
            }
        };

        const res = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(payload)
        });
        return await res.json();
    };

    let initData = await makeInitRequest(targetPrivacy);

    // Nếu môi trường Sandbox/chưa duyệt app bắt buộc privacy SELF_ONLY
    if (initData.error && (initData.error.code === 'unaudited_client_can_only_post_to_private_accounts' || initData.error.message?.includes('private'))) {
        console.log('App chưa duyệt audit, tự động chuyển privacy sang SELF_ONLY');
        initData = await makeInitRequest('SELF_ONLY');
    }

    if (initData.error && initData.error.code !== 'ok') {
        return initData;
    }

    const uploadUrl = initData?.data?.upload_url;
    if (!uploadUrl) {
        return initData;
    }

    // 3. Đẩy binary video lên máy chủ upload của TikTok
    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': String(videoSize),
            'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`
        },
        body: new Uint8Array(videoBuffer)
    });

    if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error('Lỗi đẩy binary video lên TikTok:', uploadRes.status, errText);
        return {
            error: {
                code: 'upload_failed',
                message: `Lỗi upload video lên TikTok: ${uploadRes.status}`
            }
        };
    }

    return {
        data: {
            publish_id: initData.data?.publish_id
        },
        error: { code: 'ok' }
    };
}

/**
 * 5b. Publish video using PULL_FROM_URL (Requires verified domain on TikTok portal)
 */
export async function publishVideoFromUrl(accessToken: string, options: TikTokPublishOptions) {
    if (!options.videoUrl) {
        throw new Error('Video URL is required for PULL_FROM_URL publish mode.');
    }

    const payload = {
        post_info: {
            title: options.title,
            privacy_level: options.privacyLevel || 'PUBLIC_TO_EVERYONE',
            disable_duet: options.disableDuet ?? false,
            disable_stitch: options.disableStitch ?? false,
            disable_comment: options.disableComment ?? false,
            video_cover_timestamp_ms: options.videoCoverTimestampMs || 1000,
            auto_add_music: options.autoAddMusic ?? true
        },
        source_info: {
            source: 'PULL_FROM_URL',
            video_url: options.videoUrl
        }
    };

    const res = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
}

/**
 * 6. Check publish status
 */
export async function checkTikTokPublishStatus(accessToken: string, publishId: string) {
    const res = await fetch(`${TIKTOK_API_BASE}/post/publish/status/fetch/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({ publish_id: publishId })
    });

    return await res.json();
}
