export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to insert analytics regardless of RLS
// Initialize lazily to avoid build-time errors if env vars are missing
const getSupabaseAdmin = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
);

// Simple in-memory cache for IP geolocation to avoid hitting rate limits
// Key: IP address, Value: { city, region, country, timestamp }
const geoCache = new Map<string, { city: string | null; region: string | null; country: string | null; isHosting: boolean; org: string | null; ts: number }>();
const GEO_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getGeoFromIP(ip: string): Promise<{ city: string | null; region: string | null; country: string | null; isHosting: boolean; org: string | null }> {
    const fallback = { city: null, region: null, country: null, isHosting: false, org: null };

    // Skip localhost / private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return fallback;
    }

    // Check cache first
    const cached = geoCache.get(ip);
    if (cached && (Date.now() - cached.ts) < GEO_CACHE_TTL) {
        return { city: cached.city, region: cached.region, country: cached.country, isHosting: cached.isHosting, org: cached.org };
    }

    try {
        // ip-api.com: lấy thêm trường hosting, org để nhận diện Datacenter / Cloud Server Farm
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,city,regionName,country,hosting,org,as&lang=vi`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!response.ok) return fallback;

        const data = await response.json();

        if (data.status === 'success') {
            const isHosting = Boolean(data.hosting) || 
                (data.org && /alibaba|tencent|baidu|huawei|amazon|google|microsoft|digitalocean|linode|ovh|cloudflare|vultr|hetzner/i.test(data.org)) ||
                (data.as && /alibaba|tencent|baidu|huawei|amazon|google|microsoft|digitalocean|linode|ovh|cloudflare|vultr|hetzner/i.test(data.as));

            const result = {
                city: data.city || null,
                region: data.regionName || null,
                country: data.country || null,
                isHosting: Boolean(isHosting),
                org: data.org || null,
            };
            // Cache the result
            geoCache.set(ip, { ...result, ts: Date.now() });

            // Evict old entries periodically (keep cache manageable)
            if (geoCache.size > 5000) {
                const now = Date.now();
                geoCache.forEach((val, key) => {
                    if (now - val.ts > GEO_CACHE_TTL) geoCache.delete(key);
                });
            }

            return result;
        }
    } catch (err) {
        // Silently fail — geolocation is best-effort, should never block tracking
        console.warn('[Analytics Geo] Lookup failed for IP:', ip, err);
    }

    return fallback;
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await req.json();
        const { session_id, visitor_id, url, pathname, referrer, screen_width, load_time_ms, is_webdriver } = body;

        if (!session_id || !visitor_id || !url || !pathname) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get User-Agent and parse device info
        const userAgent = req.headers.get("user-agent") || "";
        
        let device_type = "desktop";
        if (/mobile/i.test(userAgent)) device_type = "mobile";
        if (/tablet/i.test(userAgent) || (/ipad/i.test(userAgent))) device_type = "tablet";

        let browser = "Unknown";
        if (userAgent.includes("Edg/")) browser = "Edge";
        else if (userAgent.includes("Chrome/")) browser = "Chrome";
        else if (userAgent.includes("Firefox/")) browser = "Firefox";
        else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) browser = "Safari";
        
        let os = "Unknown";
        if (userAgent.includes("Win")) os = "Windows";
        else if (userAgent.includes("Mac")) os = "MacOS";
        else if (userAgent.includes("Android")) os = "Android";
        else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
        else if (userAgent.includes("Linux")) os = "Linux";

        // Detect Bots & AI Search Engines
        let is_bot = Boolean(is_webdriver);
        let bot_name = is_webdriver ? "Headless Scraper (Automated)" : null;
        const lowerUA = userAgent.toLowerCase();
        
        // ── 1. CÔNG CỤ TÌM KIẾM CHÍNH THỐNG (SEO) ──
        if (lowerUA.includes("googlebot")) { is_bot = true; bot_name = "Googlebot"; }
        else if (lowerUA.includes("bingbot")) { is_bot = true; bot_name = "Bingbot"; }
        else if (lowerUA.includes("yandex")) { is_bot = true; bot_name = "YandexBot"; }
        else if (lowerUA.includes("baiduspider")) { is_bot = true; bot_name = "Baidu Spider"; }
        else if (lowerUA.includes("facebookexternalhit") || lowerUA.includes("facebookcatalog")) { is_bot = true; bot_name = "Facebook Bot"; }
        else if (lowerUA.includes("zalo")) { is_bot = true; bot_name = "Zalo Bot"; }

        // ── 2. CÁC NỀN TẢNG AI LỚN TOÀN CẦU & TRUNG QUỐC (AI Search Engines) ──
        else if (lowerUA.includes("deepseek")) { is_bot = true; bot_name = "DeepSeek AI"; }
        else if (lowerUA.includes("qwen") || lowerUA.includes("alispider") || lowerUA.includes("alibaba")) { is_bot = true; bot_name = "Alibaba Qwen AI"; }
        else if (lowerUA.includes("kimi") || lowerUA.includes("moonshot")) { is_bot = true; bot_name = "Moonshot Kimi AI"; }
        else if (lowerUA.includes("hunyuan")) { is_bot = true; bot_name = "Tencent Hunyuan AI"; }
        else if (lowerUA.includes("chatgpt") || lowerUA.includes("gptbot") || lowerUA.includes("oai-searchbot")) { is_bot = true; bot_name = "ChatGPT / OpenAI"; }
        else if (lowerUA.includes("claude")) { is_bot = true; bot_name = "Claude AI"; }
        else if (lowerUA.includes("perplexity")) { is_bot = true; bot_name = "Perplexity AI"; }
        else if (lowerUA.includes("bytespider")) { is_bot = true; bot_name = "ByteDance AI (TikTok/Douyin)"; }

        // ── 3. SCRAPERS RÁC VÔ DANH / CÔNG CỤ CÀO DỮ LIỆU THÔ ──
        else if (
            lowerUA.includes("ccbot") || lowerUA.includes("turnitin") || lowerUA.includes("diffbot") ||
            lowerUA.includes("bot") || lowerUA.includes("crawler") || lowerUA.includes("spider") ||
            lowerUA.includes("vercel") || lowerUA.includes("lighthouse") || lowerUA.includes("headless") ||
            lowerUA.includes("postman") || lowerUA.includes("curl") || lowerUA.includes("python") ||
            lowerUA.includes("node-fetch") || lowerUA.includes("undici") || lowerUA.includes("axios") ||
            lowerUA.includes("healthcheck") || lowerUA.includes("uptime")
        ) { 
            is_bot = true; 
            bot_name = "Generic Bot / Tool"; 
        }

        // Clean referrer & Chuẩn hóa nguồn AI giới thiệu (Referrer)
        let cleanReferrer = referrer || null;
        if (cleanReferrer) {
            try {
                const refUrl = new URL(cleanReferrer);
                const host = refUrl.hostname.toLowerCase();
                
                if (
                    host.includes('lyhu.com.vn') || 
                    host.includes('lyhu-b2b-platform.vercel.app') || 
                    host.includes('localhost') ||
                    host.includes('accounts.google.com')
                ) {
                    cleanReferrer = null; // Mark as Direct
                } else if (host.includes('deepseek.com')) {
                    cleanReferrer = 'DeepSeek AI';
                } else if (host.includes('chatgpt.com') || host.includes('openai.com')) {
                    cleanReferrer = 'ChatGPT';
                } else if (host.includes('perplexity.ai')) {
                    cleanReferrer = 'Perplexity AI';
                } else if (host.includes('claude.ai')) {
                    cleanReferrer = 'Claude AI';
                } else if (host.includes('gemini.google.com')) {
                    cleanReferrer = 'Google Gemini';
                } else if (host.includes('kimi.ai') || host.includes('moonshot.cn')) {
                    cleanReferrer = 'Kimi AI (Moonshot)';
                } else if (host.includes('aliyun.com') || host.includes('alibaba.com')) {
                    cleanReferrer = 'Alibaba AI (Qwen)';
                } else if (host.includes('baidu.com')) {
                    cleanReferrer = 'Baidu Search / AI';
                } else {
                    // Giữ lại origin chuẩn
                    cleanReferrer = refUrl.origin;
                }
            } catch (e) {
                cleanReferrer = null;
            }
        }

        // Get visitor IP and lookup geolocation
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "";
        
        let geo = { city: null as string | null, region: null as string | null, country: null as string | null, isHosting: false, org: null as string | null };
        if (ip) {
            geo = await getGeoFromIP(ip);

            // ── BẪY CHUẨN XÁC: NẾU ĐẾN TỪ DATACENTER / CLOUD HOSTING (Bắc Kinh, Alibaba, Tencent...) ──
            // Người đọc báo thông thường dùng mạng dân dụng (Viettel, VNPT, FPT, China Telecom/Unicom cá nhân).
            // Nếu truy cập từ máy chủ đám mây (Hosting=true) mà không có referrer hoặc hành vi cào liên tục -> Đánh dấu là Bot Scraper!
            if (!is_bot && geo.isHosting) {
                is_bot = true;
                bot_name = geo.org ? `Cloud Scraper (${geo.org.split(' ')[0]})` : "Datacenter Scraper";
            }

            // Post-geo bot detection: Meta/Facebook crawlers
            const metaDatacenters = ["Prineville", "Fort Worth", "Forest City", "Luleå", "Ashburn", "Boardman", "Altoona", "Los Lunas", "New Albany", "Papillion", "Eagle Mountain", "Gallatin", "DeKalb", "Stanton", "Mesa", "Kuna", "Dublin", "Clonee", "Odense"];
            if (geo.city && metaDatacenters.includes(geo.city)) {
                if (cleanReferrer && cleanReferrer.includes("facebook.com")) {
                    is_bot = true;
                    bot_name = "Facebook Crawler (Cloaked)";
                }
            }
        }

        // Insert to DB
        const { error } = await supabaseAdmin
            .from("website_page_views")
            .insert({
                session_id,
                visitor_id,
                url,
                pathname,
                referrer: cleanReferrer,
                device_type,
                browser,
                os,
                user_agent: userAgent,
                screen_width: screen_width || null,
                is_bot,
                bot_name,
                load_time_ms: load_time_ms || null,
                city: geo.city,
                region: geo.region,
                country: geo.country,
            });

        if (error) {
            console.error("Analytics Tracking Error:", error);
            // Don't throw 500 for tracking errors, just log it so client doesn't crash
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Analytics Tracking Exception:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
