"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authenticateUser, setCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

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

        const user = authenticateUser(email.trim());

        if (!user) {
            setIsSubmitting(false);
            setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
            return;
        }

        setCurrentUser(user);

        switch (user.role) {
            case ROLES.ADMIN:
                router.push("/admin");
                break;
            case ROLES.SALES:
                router.push("/sales");
                break;
            case ROLES.CTV:
                router.push("/ctv");
                break;
            case ROLES.CUSTOMER:
                router.push("/customer");
                break;
            default:
                router.push("/");
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="w-full border-b border-slate-200 bg-white">
                <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
                            LY
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-sm sm:text-base">
                                LYHU B2B Platform
                            </span>
                            <span className="text-xs text-slate-500 hidden sm:block">
                                Ứng dụng đặt hàng & quản lý kênh GT/MT
                            </span>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        ← Về trang chọn vai trò
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
                            Đăng nhập
                        </h1>
                        <p className="text-sm text-slate-500 mb-6">
                            Nhập email và mật khẩu để truy cập hệ thống
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@lyhu.vn"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">
                                    Mật khẩu
                                </label>
                                <input
                                    type="password"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
                            </button>
                        </form>

                        {/* Mock accounts hint */}
                        <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600">
                            <p className="font-medium text-slate-700 mb-2">💡 Tài khoản mẫu:</p>
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
