import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { submitToIndexNow, SITE_HOST } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { urls, type = "latest" } = body;

        // Nếu truyền urls cụ thể thì submit danh sách đó
        if (urls && Array.isArray(urls) && urls.length > 0) {
            const result = await submitToIndexNow(urls);
            return NextResponse.json(result);
        }

        // Nếu không truyền, mặc định lấy toàn bộ hoặc 50 bài viết mới nhất từ Database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        const limit = type === "all" ? 1500 : 50;

        const { data: posts, error } = await supabase
            .from("blog_posts")
            .select("slug")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const urlList = [
            `https://${SITE_HOST}`,
            `https://${SITE_HOST}/tin-tuc`,
            `https://${SITE_HOST}/wholesale`,
            ...(posts || []).map((p) => `https://${SITE_HOST}/tin-tuc/${p.slug}`)
        ];

        const result = await submitToIndexNow(urlList);

        return NextResponse.json({
            ...result,
            totalSubmitted: urlList.length,
            sample: urlList.slice(0, 5)
        });
    } catch (err: any) {
        console.error("[IndexNow Route Error]:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
