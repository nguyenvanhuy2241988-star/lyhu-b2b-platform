"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { getHomePath } from "@/lib/roles";

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                setMsg(error.message);
                return;
            }

            if (user) {
                // Fetch role
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                const nextParam = searchParams.get("next");
                if (nextParam && nextParam.startsWith("/")) {
                    router.push(nextParam);
                } else {
                    router.push(getHomePath(profile?.role));
                }
            }
        } catch (err: any) {
            setMsg(err?.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const origin = window.location.origin;
            const next = searchParams.get("next") ?? "/";
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
                },
            });
            if (error) setMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="w-full border-b border-slate-200 bg-white">
                <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-5">
                    <div className="flex items-center gap-6">
                        <img
                            src="/logo-full.png"
                            alt="LYHU Logo"
                            className="h-16 w-auto object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<div class="h-12 w-12 rounded-full bg-primary-500 text-white grid place-items-center font-bold text-xl">LY</div>');
                            }}
                        />
                        <div>
                            <div className="font-bold text-xl text-slate-800 leading-6">LYHU B2B Platform</div>
                            <div className="text-[12px] font-medium text-primary-600 uppercase tracking-wider mt-0.5">
                                KẾT NỐI CHÂN THÀNH • HỢP TÁC BỀN VỮNG
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="text-sm text-slate-600 hover:text-slate-900"
                    >
                        ← Về trang chọn vai trò
                    </button>
                </div>
            </header>

            {/* Body */}
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                    <h1 className="text-2xl font-bold mb-1">Đăng nhập</h1>
                    <p className="text-sm text-slate-500 mb-6">
                        Nhập email và mật khẩu để truy cập hệ thống
                    </p>

                    {msg ? (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                            {msg}
                        </div>
                    ) : null}

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-200"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                            <input
                                type="password"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-200"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-primary-600 text-white py-3 font-bold shadow-lg shadow-primary-100 hover:bg-primary-700 hover:shadow-primary-200 transition-all active:scale-[0.98] disabled:opacity-60"
                        >
                            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
                        </button>
                    </form>

                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px bg-slate-200 flex-1" />
                        <div className="text-xs text-slate-400">Hoặc</div>
                        <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 py-2 font-semibold hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">G</span>
                        Đăng nhập bằng Google
                    </button>
                </div>
            </main>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    );
}
