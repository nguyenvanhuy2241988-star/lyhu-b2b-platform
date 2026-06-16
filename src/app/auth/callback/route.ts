import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getHomePath, isRoleAllowedPath, type Role } from "@/lib/roles";

function getSupabase() {
    const cookieStore = cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    return createServerClient(supabaseUrl, supabaseAnon, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    cookieStore.set(name, value, options);
                }
            },
        },
    });
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const nextParam = url.searchParams.get("next"); // dạng "/admin" ...

    // Priority: 1. Keep localhost if currently on localhost. 2. NEXT_PUBLIC_SITE_URL. 3. Vercel URL.
    let baseUrl = url.origin;

    // BỎ QUA VIỆC OVERRIDE baseUrl.
    // Nếu callback rơi vào domain nào (vercel.app hay lyhu.com.vn) thì BẮT BUỘC phải redirect
    // về đúng domain đó để trình duyệt giữ lại Cookie (tránh lỗi cross-domain login).
    let baseUrl = url.origin;

    const error = url.searchParams.get("error");
    const error_description = url.searchParams.get("error_description");
    if (error || error_description) {
        return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error_description || error || "unknown")}`);
    }

    if (!code) return NextResponse.redirect(`${baseUrl}/login?error=no_code`);

    const supabase = getSupabase();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${baseUrl}/login?error=oauth_exchange_failed`);

    const user = data.user;
    if (!user) return NextResponse.redirect(`${baseUrl}/login?error=no_user`);

    // Lấy role từ profiles
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    // Nếu chưa có profile/role thì fallback "customer" (hoặc bạn đổi default theo ý)
    const targetRole = (profile?.role || "customer") as Role;

    // mặc định nhảy về dashboard theo role
    let redirectTo = getHomePath(targetRole);

    // ưu tiên next nếu hợp lệ + đúng quyền
    if (nextParam && nextParam.startsWith("/")) {
        if (isRoleAllowedPath(targetRole, nextParam as any)) {
            redirectTo = nextParam;
        }
    }

    // Xử lý dấu slash để tránh lỗi //admin
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanRedirectTo = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;

    const separator = cleanRedirectTo.includes('?') ? '&' : '?';
    return NextResponse.redirect(`${cleanBaseUrl}${cleanRedirectTo}${separator}from_callback=1`);
}
