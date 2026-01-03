import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getHomePath, isRoleAllowedPath, PROTECTED_PREFIXES, SHARED_PATHS, type Role } from "@/lib/roles";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const origin = request.nextUrl.origin;

  // chuẩn bị response để supabase set cookie
  let response = NextResponse.next({ request });

  // Chuẩn bị URL an toàn để tránh crash middleware nếu thiếu env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  const isConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  try {
    let user = null;
    let role: Role = "customer";

    try {
      // Removed timeout protection - let Supabase handle its own connection lifecycle
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      user = authUser;

      if (authError) {
        console.warn("[Middleware] Auth fetch error (possibly connection issue):", authError.message);
      }
    } catch (err: any) {
      console.error("[Middleware] Auth catastrophic fail:", err);
    }

    // Only redirect if we definitely know there is no user AND it's a protected route
    if (!user && isProtected) {
      console.log("[Middleware] No user for protected route, redirecting to login.");
      const next = `${pathname}${search || ""}`;
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }

    // Đã login: lấy role
    if (user) {
      try {
        // Removed role fetch timeout
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        role = (profile?.role || "customer") as Role;
      } catch (roleErr) {
        console.warn("[Middleware] Role fetch error, checking shared paths.", roleErr);
        if (SHARED_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
          return response;
        }
        role = "customer"; // Fallback
      }

      const home = getHomePath(role);

      // 1. Nếu vào /login hoặc "/" thì đẩy về đúng dashboard
      if (pathname === "/login" || pathname === "/") {
        return NextResponse.redirect(new URL(home, origin));
      }

      // 2. Nếu cố vào sai khu vực bảo vệ VÀ không phải trang dùng chung => đá về dashboard role
      if (isProtected && !isRoleAllowedPath(role, pathname)) {
        console.warn(`[Middleware] Path ${pathname} not allowed for role ${role}. Redirecting to ${home}`);
        return NextResponse.redirect(new URL(home, origin));
      }
    }
  } catch (err) {
    if (isConfigured) {
      console.error("[Middleware] Runtime error:", err);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
