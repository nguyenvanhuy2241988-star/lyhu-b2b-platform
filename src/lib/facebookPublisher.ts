/**
 * Facebook Video & Reels Publishing Service for LYHU App
 * Interacts with Meta Graph API v21.0
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabaseAdmin() {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false }
    });
}

export interface FacebookPageItem {
    id: string;
    page_id: string;
    name: string;
    category?: string;
    avatar_url?: string;
    brand_tag: string;
    is_connected: boolean;
}

/**
 * Auto-detect brand from page name
 */
export function inferBrandFromPageName(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('boyo')) return 'BOYO';
    if (n.includes('cvt') || n.includes('khoai môn')) return 'CVT';
    if (n.includes('uhi')) return 'UHI';
    if (n.includes('abi')) return 'ABI SNACK';
    if (n.includes('lyhu')) return 'LYHU';
    return 'Tất cả';
}

/**
 * 1. Get all connected Facebook Pages from database
 */
export async function getConnectedFacebookPages(): Promise<FacebookPageItem[]> {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('facebook_pages')
            .select('id, page_id, name, category, avatar_url, is_connected, chatbot_config')
            .eq('is_connected', true);

        if (error || !data) {
            console.error('Lỗi lấy danh sách facebook_pages:', error);
            return [];
        }

        return data.map(p => {
            const savedBrand = p.chatbot_config?.brand_tag;
            return {
                id: p.id,
                page_id: p.page_id,
                name: p.name,
                category: p.category,
                avatar_url: p.avatar_url,
                brand_tag: savedBrand || inferBrandFromPageName(p.name),
                is_connected: p.is_connected
            };
        });
    } catch (e) {
        console.error('Exception fetching facebook_pages:', e);
        return [];
    }
}

/**
 * 2. Update brand tag for a Facebook Page
 */
export async function updateFacebookPageBrand(pageId: string, brandTag: string): Promise<boolean> {
    try {
        const supabase = getSupabaseAdmin();
        const { data: page } = await supabase
            .from('facebook_pages')
            .select('chatbot_config')
            .eq('page_id', pageId)
            .single();

        const currentConfig = page?.chatbot_config || {};
        currentConfig.brand_tag = brandTag;

        const { error } = await supabase
            .from('facebook_pages')
            .update({ chatbot_config: currentConfig })
            .eq('page_id', pageId);

        return !error;
    } catch (e) {
        console.error('Error updating facebook page brand:', e);
        return false;
    }
}

/**
 * 3. Publish a Video/Reel to a Facebook Page
 */
export async function publishVideoToFacebookPage(
    pageId: string, 
    options: {
        title: string;
        description: string;
        videoUrl: string;
        videoBuffer?: Buffer;
    }
) {
    const supabase = getSupabaseAdmin();
    const { data: page, error: pageErr } = await supabase
        .from('facebook_pages')
        .select('page_id, name, access_token')
        .eq('page_id', pageId)
        .single();

    if (pageErr || !page || !page.access_token) {
        throw new Error(`Không tìm thấy token của Fanpage ${pageId}`);
    }

    // Graph API Page Video endpoint
    const url = `https://graph.facebook.com/v21.0/${pageId}/videos`;

    // Mode 1: Using file_url directly (Fast, no server bandwidth usage)
    const params = new URLSearchParams({
        file_url: options.videoUrl,
        title: options.title,
        description: options.description || options.title,
        access_token: page.access_token
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });

    const data = await res.json();

    if (data.error) {
        // Mode 2 Fallback: If file_url download failed, try uploading binary with FormData
        if (options.videoBuffer || options.videoUrl) {
            try {
                let buf = options.videoBuffer;
                if (!buf) {
                    const dlRes = await fetch(options.videoUrl);
                    buf = Buffer.from(await dlRes.arrayBuffer());
                }

                const formData = new FormData();
                const blob = new Blob([new Uint8Array(buf)], { type: 'video/mp4' });
                formData.append('source', blob, 'video.mp4');
                formData.append('title', options.title);
                formData.append('description', options.description || options.title);
                formData.append('access_token', page.access_token);

                const formRes = await fetch(url, {
                    method: 'POST',
                    body: formData
                });
                const formDataRes = await formRes.json();
                if (formDataRes.error) {
                    return {
                        success: false,
                        page_id: pageId,
                        page_name: page.name,
                        error: formDataRes.error.message || 'Lỗi đăng video lên Facebook'
                    };
                }
                return {
                    success: true,
                    page_id: pageId,
                    page_name: page.name,
                    post_id: formDataRes.id
                };
            } catch (fallbackErr: any) {
                return {
                    success: false,
                    page_id: pageId,
                    page_name: page.name,
                    error: fallbackErr.message || data.error.message
                };
            }
        }

        return {
            success: false,
            page_id: pageId,
            page_name: page.name,
            error: data.error.message || 'Lỗi đăng video lên Facebook'
        };
    }

    return {
        success: true,
        page_id: pageId,
        page_name: page.name,
        post_id: data.id
    };
}
