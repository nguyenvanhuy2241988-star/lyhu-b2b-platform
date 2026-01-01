"use client";

import React from "react";
import { BookOpen, Award, ShieldAlert, GraduationCap, CheckCircle2, AlertCircle, Info, ArrowRight } from "lucide-react";

export default function TelesalesRulesPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-16">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm tracking-wide uppercase">
                    <BookOpen className="w-4 h-4" />
                    <span>Chính sách & Quy định</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Cơ chế Thu nhập Telesales V2.0
                </h1>
                <p className="text-slate-500 leading-relaxed max-w-2xl">
                    Minh bạch, công bằng và tập trung vào hiệu suất. Hệ thống được thiết kế để hỗ trợ đội ngũ phát triển bền vững cùng LYHU.
                </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-12">

                {/* 1. Lương Cố định */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">1. Lương Cố định (Base Salary)</h2>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mức lương Part-time</p>
                                <div className="text-4xl font-bold text-slate-900">
                                    2.500.000 <span className="text-lg font-medium text-slate-400">VND</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>Thanh toán vào ngày mùng 5 hàng tháng</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>Định mức 4.5 tiếng/ngày</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50/50 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-primary-500" />
                                    Phụ cấp & Phúc lợi
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                                        <span className="text-sm text-slate-600 font-medium">Gửi xe</span>
                                        <span className="text-sm font-bold text-primary-600">100.000đ</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                                        <span className="text-sm text-slate-600 font-medium">Trang phục</span>
                                        <span className="text-sm font-bold text-slate-600 italic">Cấp theo quý</span>
                                    </div>
                                </div>
                            </div>
                            <div className="md:w-64 p-4 rounded-xl bg-primary-50/30 border border-primary-100">
                                <p className="text-xs text-primary-700 leading-relaxed italic">
                                    "Lương cứng được đảm bảo dựa trên sự chuyên cần. Nghỉ không phép quá 3 buổi sẽ bị xem xét lại định mức."
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Hệ thống Thưởng */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <Award className="w-5 h-5 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">2. Hệ thống Thưởng (Incentives)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "Siêu thị", amount: "100.000đ", desc: "Mỗi khách hàng kênh Siêu thị mới." },
                            { title: "Đại lý", amount: "300.000đ", desc: "Mỗi đơn hàng đầu tiên của Đại lý mới." },
                            { title: "Sáng kiến", amount: "50-200k", desc: "Mỗi ý kiến cải tiến quy trình hiệu quả." }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-primary-200 transition-colors">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{item.title}</p>
                                    <div className="text-2xl font-bold text-slate-900 mb-2">{item.amount}</div>
                                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-primary-600">LIÊN HỆ QUẢN LÝ</span>
                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Chế tài */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">3. Chế tài & Kỷ luật</h2>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quy định vi phạm (Dự kiến 2025)</span>
                            <AlertCircle className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="divide-y divide-slate-100">
                            {[
                                { name: "Đi muộn / Về sớm", desc: "Không có lý do chính đáng & chưa báo Admin", fine: "50.000đ" },
                                { name: "Sai lệch Trang phục", desc: "Quên mặc đồng phục khi có sự kiện", fine: "50.000đ" }
                            ].map((violation, idx) => (
                                <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <h5 className="font-bold text-slate-900">{violation.name}</h5>
                                        <p className="text-xs text-slate-400 font-medium">{violation.desc}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-rose-600">{violation.fine}</span>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase">Mỗi lần</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-900 text-white rounded-b-2xl">
                            <div className="flex gap-4 items-start">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Info className="w-5 h-5 text-primary-400" />
                                </div>
                                <p className="text-sm font-medium leading-relaxed italic opacity-90">
                                    Mọi khoản phí phạt tại LYHU đều được gom vào quỹ <strong className="text-primary-400 font-bold">Bonding</strong> để dùng cho các hoạt động ngoại khóa, liên hoan của tập thể Telesales.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer / CTA */}
            <div className="pt-12 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-xs text-slate-400 font-medium"> Cập nhật: 30/12/2024 · v3.0 Minimalist </p>
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95"
                >
                    Quay lại Dashboard
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    );
}
