"use client";

import React from "react";
import { Wallet, Gift, AlertTriangle, Clock, CheckCircle2, Info, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TelesalesRulesPage() {
    const router = useRouter();

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
            {/* Back button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Quay lại
            </button>

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-slate-900">Chính sách Thu nhập Telesales</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Minh bạch, công bằng và tập trung vào hiệu suất.
                </p>
            </div>

            {/* 1. Lương cố định */}
            <section className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">Lương cố định</h2>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <p className="text-xs text-slate-400 font-medium mb-1">Mức lương Part-time</p>
                            <p className="text-2xl font-bold text-slate-900">2.500.000 <span className="text-sm font-normal text-slate-400">VND</span></p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Thanh toán vào ngày 5 hàng tháng</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Định mức 4.5 tiếng/ngày</span>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-medium text-slate-500 mb-3">Phụ cấp & Phúc lợi</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600">Gửi xe</span>
                                <span className="text-sm font-semibold text-slate-900">100.000đ</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600">Trang phục</span>
                                <span className="text-sm font-medium text-slate-500">Cấp theo quý</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Lương cứng được đảm bảo dựa trên sự chuyên cần. Nghỉ không phép quá 3 buổi sẽ bị xem xét lại định mức.
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. Hệ thống thưởng */}
            <section className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <Gift className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">Hệ thống thưởng</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {[
                        { title: "Mở mới Siêu thị", amount: "100.000đ", desc: "Mỗi khách hàng kênh Siêu thị mới" },
                        { title: "Mở mới Đại lý", amount: "300.000đ", desc: "Mỗi đơn hàng đầu tiên của Đại lý mới" },
                        { title: "Sáng kiến", amount: "50 - 200k", desc: "Mỗi ý kiến cải tiến quy trình hiệu quả" },
                    ].map((item, idx) => (
                        <div key={idx} className="px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                            </div>
                            <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">+{item.amount}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Chế tài & Kỷ luật */}
            <section className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">Chế tài & Kỷ luật</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {[
                        { name: "Đi muộn / Về sớm", desc: "Không có lý do chính đáng & chưa báo Admin", fine: "50.000đ" },
                        { name: "Sai lệch Trang phục", desc: "Quên mặc đồng phục khi có sự kiện", fine: "50.000đ" },
                    ].map((v, idx) => (
                        <div key={idx} className="px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{v.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{v.desc}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-rose-600">-{v.fine}</span>
                                <p className="text-[10px] text-slate-400 mt-0.5">mỗi lần</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Mọi khoản phí phạt đều được gom vào quỹ <strong className="text-slate-700">Bonding</strong> để dùng cho các hoạt động ngoại khóa, liên hoan của tập thể Telesales.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <div className="text-center">
                <p className="text-xs text-slate-400">Cập nhật: 01/03/2026 · v3.1</p>
            </div>
        </div>
    );
}
