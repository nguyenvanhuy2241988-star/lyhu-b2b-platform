"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authenticateUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

// Map role -> route
const ROLE_TO_ROUTE: Record<string, string> = {
    [ROLES.ADMIN]: "/admin",
    [ROLES.SALES]: "/sales",
    [ROLES.CTV]: "/ctv",
    [ROLES.CUSTOMER]: "/customer",
};

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("admin@lyhu.vn");
    const [password, setPassword] = useState("admin123");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const user = authenticateUser(email, password);

        if (!user) {
            setIsSubmitting(false);
            setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
            return;
        }

        const targetRoute = ROLE_TO_ROUTE[user.role];

        if (!targetRoute) {
            setIsSubmitting(false);
            setError("Không tìm được trang phù hợp cho tài khoản này.");
            return;
        }

        // Redirect đúng dashboard theo role
        router.push(targetRoute);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top bar thương hiệu */}
            <header className="flex items-center justify-between px-4 py-3 sm:px-8 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-semibold">
                        LY
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                            LYHU B2B Platform
                        </span>
                        <span className="text-xs text-slate-500">
                            Ứng dụng đặt hàng & quản lý kênh GT/MT
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-xs sm:text-sm text-slate-500 hover:text-slate-700"
                >
                    ← Về trang chọn vai trò
                </button>
            </header>

            {/* Nội dung chính */}
            <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-md">
                    <div className="bg-white shadow-sm rounded-2xl border border-slate-200 p-6 sm:p-8">
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">
                            Đăng nhập nội bộ
                        </h1>
                        <p className="text-sm text-slate-500 mb-6">
                            Dùng tài khoản mock để vào đúng dashboard (Admin, Sales, CTV, Khách hàng).
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@lyhu.vn"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Mật khẩu
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-lg bg-emerald-500 text-white text-sm font-medium py-2.5 mt-2 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
                            </button>
                        </form>

                        {/* Box tài khoản mẫu */}
                        <div className="mt-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
                            <div className="font-semibold text-slate-800 mb-1">
                                Tài khoản mẫu:
                            </div>
                            <ul className="space-y-1">
                                <li>admin@lyhu.vn / admin123 → Admin</li>
                                <li>sales@lyhu.vn / sales123 → Sales</li>
                                <li>ctv@lyhu.vn / ctv123 → CTV</li>
                                <li>customer@lyhu.vn / customer123 → Customer</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
