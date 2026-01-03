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

    // Use NEXT_PUBLIC_SITE_URL if available
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // Fallback logic for Vercel
    if (!baseUrl) {
        if (process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`;
        } else {
            baseUrl = url.origin;
        }
    }

    // Safety check: Avoid localhost on non-local environments
    if (baseUrl.includes('localhost') && process.env.NODE_ENV === 'production' && process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
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

    return NextResponse.redirect(`${baseUrl}${redirectTo}`);
}
