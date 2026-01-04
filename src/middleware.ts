import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { PROTECTED_PREFIXES } from "@/lib/roles";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const origin = request.nextUrl.origin;

  // Chuẩn bị response
  let response = NextResponse.next({ request });

  // Safe Env Vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

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

  // Check Protected Route
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  try {
    // 1. Chỉ check Auth (Có user hay không)
    const { data: { user }, error } = await supabase.auth.getUser();

    // 2. Xử lý chưa đăng nhập
    if (!user && isProtected) {
      console.log(`[Middleware] Unauthorized access to ${pathname}. Redirecting to /login`);
      const next = `${pathname}${search || ""}`;
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }

    // 3. Đã đăng nhập -> CHO QUA (Không fetch role nữa)
    // Client-side sẽ lo việc redirect nếu sai role hoặc vào /login lại
    if (user) {
      // Optional: Nếu đang ở /login mà có user thì có thể muốn đẩy đi đâu đó, 
      // nhưng vì không biết role nên tốt nhất để Client xử lý để tránh sai hướng.
      // Tuy nhiên, để tránh user bị kẹt ở login, ta có thể cho vào callback hoặc dashboard chung nếu cần.
      // NHƯNG theo yêu cầu "Nếu có user -> cho qua", ta sẽ return response.
      return response;
    }

  } catch (err) {
    console.error("[Middleware] Error:", err);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
