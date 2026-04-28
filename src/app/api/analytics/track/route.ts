import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to insert analytics regardless of RLS
// Initialize lazily to avoid build-time errors if env vars are missing
const getSupabaseAdmin = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
);

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
                load_time_ms: load_time_ms || null
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
