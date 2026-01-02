import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getHomePath, isRoleAllowedPath, PROTECTED_PREFIXES, type Role } from "@/lib/roles";

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
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    // Chưa login mà vào khu protected => đá về /login?next=...
    if (!user && isProtected) {
      const next = `${pathname}${search || ""}`;
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }

    // Đã login: lấy role
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = (profile?.role || "customer") as Role;
      const home = getHomePath(role);

      // Nếu vào /login hoặc "/" thì đẩy về đúng dashboard
      if (pathname === "/login" || pathname === "/") {
        return NextResponse.redirect(new URL(home, origin));
      }

      // Nếu cố vào sai khu role => đá về dashboard role
      if (isProtected && !isRoleAllowedPath(role, pathname)) {
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

// Chạy middleware cho mọi route trừ static assets và các file định dạng hình ảnh/icon
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
