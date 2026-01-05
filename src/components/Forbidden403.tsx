"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

interface Forbidden403Props {
    role?: string;
    requiredPerms?: string[];
    userPerms?: string[];
}

export function Forbidden403({ role, requiredPerms, userPerms }: Forbidden403Props) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Không có quyền truy cập</h1>
            <p className="text-slate-500 mb-6 max-w-md">
                Tài khoản của bạn không có đủ quyền hạn để truy cập vào module hoặc chức năng này.
                Vui lòng liên hệ quản trị viên hoặc quay lại trang chủ.
            </p>
            <Link
                href="/"
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
                Về Trang chủ
            </Link>

            {/* ALWAYS SHOW DEBUG INFO FOR NOW */}
            <details className="mt-8 text-xs text-slate-400 text-left bg-slate-100 p-4 rounded max-w-md w-full" open>
                <summary className="cursor-pointer hover:text-slate-600 font-medium">Debug Info (Dành cho Kỹ thuật)</summary>
                <div className="mt-2 space-y-1 font-mono">
                    <div><span className="font-bold">Role:</span> {role || 'undefined'}</div>
                    <div><span className="font-bold">Required:</span> {requiredPerms?.join(', ') || 'None'}</div>
                    <div><span className="font-bold">Your Perms:</span> {userPerms?.join(', ') || 'None'}</div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                    <button
                        onClick={() => {
                            // PART 1: SYNC CHECK (GUARANTEED TO RUN)
                            const localUserStr = localStorage.getItem("lyhu_user");
                            let localUser = null;
                            try { localUser = localUserStr ? JSON.parse(localUserStr) : null; } catch (e) { }

                            alert(
                                `--- BƯỚC 1: KIỂM TRA CACHE TRÌNH DUYỆT ---\n` +
                                `(Thông tin này lấy từ máy của bạn, không cần mạng)\n\n` +
                                `Cached User: ${localUser ? 'CÓ' : 'KHÔNG'}\n` +
                                `Cached ID: ${localUser?.id || 'N/A'}\n` +
                                `Cached Role: ${localUser?.role || 'TRỐNG (Đây là nguyên nhân 403)'}\n` +
                                `Cached Email: ${localUser?.email}\n\n` +
                                `Bấm OK để tiếp tục kiểm tra Server...`
                            );

                            // PART 2: ASYNC CHECK
                            (async () => {
                                let supabaseUser = null;
                                let profileData = null;
                                let profileError = null;

                                try {
                                    const { supabase } = await import('@/lib/supabaseClient');
                                    const { data: { user } } = await supabase.auth.getUser();
                                    supabaseUser = user;

                                    if (user) {
                                        const { data, error } = await supabase
                                            .from('profiles')
                                            .select('*')
                                            .eq('id', user.id)
                                            .maybeSingle();
                                        profileData = data;
                                        profileError = error;
                                    }
                                } catch (e: any) {
                                    console.error(e);
                                    profileError = e.message || e;
                                }

                                alert(
                                    `--- BƯỚC 2: KIỂM TRA SERVER (REALTIME) ---\n` +
                                    `Live User ID: ${supabaseUser?.id || 'Không lấy được (Timeout/Null)'}\n` +
                                    `Live Profile Data: ${JSON.stringify(profileData)}\n` +
                                    `Error: ${JSON.stringify(profileError)}`
                                );
                            })();
                        }}
                        className="text-primary-600 hover:underline font-bold"
                    >
                        [Click để kiểm tra dữ liệu gốc từ Server]
                    </button>
                </div>

                {/* FORCE LOGOUT BUTTON */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <button
                        onClick={() => {
                            if (window.confirm("Bạn có chắc muốn xóa toàn bộ dữ liệu cache và đăng xuất cưỡng chế?")) {
                                localStorage.clear();
                                sessionStorage.clear();
                                document.cookie.split(";").forEach((c) => {
                                    document.cookie = c
                                        .replace(/^ +/, "")
                                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                                });
                                window.location.href = "/login";
                            }
                        }}
                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                    >
                        [Đăng xuất cưỡng chế & Xóa Cache lỗi]
                    </button>
                </div>
            </details>
        </div>
    );
}
