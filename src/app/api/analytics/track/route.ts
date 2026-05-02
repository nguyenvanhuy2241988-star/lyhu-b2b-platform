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
const geoCache = new Map<string, { city: string | null; region: string | null; country: string | null; ts: number }>();
const GEO_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getGeoFromIP(ip: string): Promise<{ city: string | null; region: string | null; country: string | null }> {
    const fallback = { city: null, region: null, country: null };

    // Skip localhost / private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return fallback;
    }

    // Check cache first
    const cached = geoCache.get(ip);
    if (cached && (Date.now() - cached.ts) < GEO_CACHE_TTL) {
        return { city: cached.city, region: cached.region, country: cached.country };
    }

    try {
        // ip-api.com free tier — no API key needed, 45 req/min limit
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,city,regionName,country&lang=vi`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!response.ok) return fallback;

        const data = await response.json();

        if (data.status === 'success') {
            const result = {
                city: data.city || null,
                region: data.regionName || null,
                country: data.country || null,
            };
            // Cache the result
            geoCache.set(ip, { ...result, ts: Date.now() });

            // Evict old entries periodically (keep cache manageable)
            if (geoCache.size > 5000) {
                const now = Date.now();
                for (const [key, val] of geoCache) {
                    if (now - val.ts > GEO_CACHE_TTL) geoCache.delete(key);
                }
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
        const { session_id, visitor_id, url, pathname, referrer, screen_width, load_time_ms } = body;

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

        // Detect Bots & AI Agents
        let is_bot = false;
        let bot_name = null;
        const lowerUA = userAgent.toLowerCase();
        
        if (lowerUA.includes("googlebot")) { is_bot = true; bot_name = "Googlebot"; }
        else if (lowerUA.includes("bingbot")) { is_bot = true; bot_name = "Bingbot"; }
        else if (lowerUA.includes("yandex")) { is_bot = true; bot_name = "YandexBot"; }
        else if (lowerUA.includes("baiduspider")) { is_bot = true; bot_name = "BaiduSpider"; }
        else if (lowerUA.includes("facebookexternalhit") || lowerUA.includes("facebookcatalog")) { is_bot = true; bot_name = "Facebook Bot"; }
        else if (lowerUA.includes("zalo")) { is_bot = true; bot_name = "Zalo Bot"; }
        else if (lowerUA.includes("chatgpt") || lowerUA.includes("gptbot")) { is_bot = true; bot_name = "ChatGPT"; }
        else if (lowerUA.includes("claude")) { is_bot = true; bot_name = "Claude AI"; }
        else if (lowerUA.includes("bot") || lowerUA.includes("crawler") || lowerUA.includes("spider")) { 
            is_bot = true; 
            bot_name = "Generic Bot"; 
        }

        // Get visitor IP and lookup geolocation
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "";
        
        // Only lookup geo for human visitors (bots don't need it)
        let geo = { city: null as string | null, region: null as string | null, country: null as string | null };
        if (!is_bot && ip) {
            geo = await getGeoFromIP(ip);
        }

        // Insert to DB
        const { error } = await supabaseAdmin
            .from("website_page_views")
            .insert({
                session_id,
                visitor_id,
                url,
                pathname,
                referrer: referrer || null,
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
