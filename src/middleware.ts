import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getHomePath, isRoleAllowedPath, PROTECTED_PREFIXES, type Role } from "@/lib/roles";

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Chạy middleware cho mọi route trừ static assets và các file định dạng hình ảnh/icon
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
