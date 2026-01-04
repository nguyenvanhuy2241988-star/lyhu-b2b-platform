"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function Forbidden403() {
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
        </div>
    );
}
