"use client";

import { ShieldAlert, AlertTriangle, CheckCircle, FileText, Info } from "lucide-react";

export default function CTVAntiFraudPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Phòng chống gian lận</h1>
                        <p className="text-slate-500 text-sm">Quy tắc ứng xử và bảo vệ tài khoản.</p>
                    </div>
                </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                        <h2 className="text-lg font-bold text-green-800">Tài khoản Trong sạch</h2>
                        <p className="text-green-700 text-sm mt-1">
                            Tuyệt vời! Tài khoản của bạn không vi phạm bất kỳ quy tắc nào.
                            Hãy tiếp tục duy trì hoạt động minh bạch.
                        </p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="space-y-2">
                        <p className="text-sm text-slate-500 font-medium">Tỷ lệ hoàn hàng</p>
                        <p className="text-2xl font-bold text-slate-900">0.5%</p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Tốt (Dưới 5%)
                        </p>
                    </div>
                    <div className="space-y-2 md:pl-6 pt-4 md:pt-0">
                        <p className="text-sm text-slate-500 font-medium">Cảnh báo vi phạm</p>
                        <p className="text-2xl font-bold text-slate-900">0</p>
                        <p className="text-xs text-slate-400">Trong 30 ngày qua</p>
                    </div>
                    <div className="space-y-2 md:pl-6 pt-4 md:pt-0">
                        <p className="text-sm text-slate-500 font-medium">Trạng thái Payout</p>
                        <p className="text-xl font-bold text-blue-600">Được phép</p>
                        <p className="text-xs text-slate-400">Không bị tạm giữ</p>
                    </div>
                </div>
            </div>

            {/* Policies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <h3 className="font-bold text-slate-900">Hành vi bị cấm</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li className="flex gap-2">
                            <span className="text-red-500">•</span>
                            Tự đặt hàng qua link giới thiệu của chính mình.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-red-500">•</span>
                            Sử dụng thông tin giả mạo để tạo đơn hàng.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-red-500">•</span>
                            Spam link giới thiệu trên các kênh chính thức của LYHU.
                        </li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Info className="w-5 h-5 text-blue-500" />
                        <h3 className="font-bold text-slate-900">Cơ chế phát hiện</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                        Hệ thống sử dụng AI để quét và phát hiện các dấu hiệu bất thường:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium">Trùng IP/Device</span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium">Địa chỉ ảo</span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium">Số điện thoại rác</span>
                    </div>
                </div>
            </div>

            <div className="text-center pt-4">
                <p className="text-xs text-slate-400">
                    Nếu bạn cho rằng mình bị đánh dấu nhầm, vui lòng liên hệ <span className="text-blue-600 cursor-pointer underline">Hỗ trợ đối tác</span>.
                </p>
            </div>
        </div>
    );
}
