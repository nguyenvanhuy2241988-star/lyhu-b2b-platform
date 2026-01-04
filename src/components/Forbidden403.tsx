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

                {/* NEW DEBUG BUTTON */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <button
                        onClick={async () => {
                            const { supabase } = await import('@/lib/supabaseClient'); // Dynamic import to be safe

                            const { data: { user } } = await supabase.auth.getUser();
                            console.log('Current User:', user);

                            if (!user) {
                                alert('No User Logged In (Auth is null)!');
                                return;
                            }

                            const { data, error } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', user.id)
                                .maybeSingle();

                            alert(`User ID: ${user.id}\nEmail: ${user.email}\n\nProfile Data: ${JSON.stringify(data, null, 2)}\n\nError: ${JSON.stringify(error, null, 2)}`);
                        }}
                        className="text-primary-600 hover:underline font-bold"
                    >
                        [Click để kiểm tra dữ liệu gốc từ Server]
                    </button>
                </div>
            </details>
        </div>
    );
}
