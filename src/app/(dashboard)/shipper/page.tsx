'use client';

import React from "react";
import { Truck, CheckCircle2, Clock, XCircle, MapPin, ArrowRight, Navigation, Phone, Wallet } from "lucide-react";
import Link from "next/link";

export default function ShipperDashboard() {
    const stats = [
        { label: "Cần giao hôm nay", value: "8", icon: Truck, color: "text-[#00AFA9]", bg: "bg-teal-50" },
        { label: "Đã giao thành công", value: "12", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Chờ lấy hàng", value: "3", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Giao thất bại", value: "1", icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
    ];

    const urgentOrders = [
        {
            id: "ORD-9921",
            customer: "Nguyễn Thị Lan",
            phone: "0912 345 678",
            address: "123 Đường Láng, Đống Đa, Hà Nội",
            deadline: "Trước 11:30 AM",
            cod: 420000,
            packages: 2
        },
        {
            id: "ORD-9924",
            customer: "Trần Minh Quân",
            phone: "0987 654 321",
            address: "Tòa S2.05 Vinhomes Smart City, Tây Mỗ",
            deadline: "Trước 14:00 PM",
            cod: 0,
            packages: 1
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#00AFA9]" /> Điều phối Giao hàng
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Theo dõi lộ trình và bàn giao đơn hàng trong ca trực
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/shipper/deliveries"
                        className="px-4 py-2 bg-[#00AFA9] hover:bg-[#009b95] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
                    >
                        Danh sách cần giao
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Quick KPI Stats (Pure Flat) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                <Link
                    href="/shipper/deliveries"
                    className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-[#00AFA9] transition-colors group flex flex-col justify-between"
                >
                    <div className="p-2 bg-teal-50 text-[#00AFA9] rounded-lg w-fit mb-2">
                        <Truck className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#00AFA9] transition-colors">Đơn cần giao</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">8 đơn hàng sẵn sàng</p>
                    </div>
                </Link>

                <Link
                    href="/shipper/wallet"
                    className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-[#00AFA9] transition-colors group flex flex-col justify-between"
                >
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg w-fit mb-2">
                        <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#00AFA9] transition-colors">Ví & Thu hộ COD</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">2.450.000 đ đang giữ</p>
                    </div>
                </Link>

                <Link
                    href="/shipper/history"
                    className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-[#00AFA9] transition-colors group flex flex-col justify-between"
                >
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg w-fit mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#00AFA9] transition-colors">Lịch sử giao</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">12 chuyến hoàn tất</p>
                    </div>
                </Link>
            </div>

            {/* Priority Deliveries */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Đơn hàng ưu tiên giao ngay
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">2 đơn gấp</span>
                </div>

                <div className="divide-y divide-slate-100">
                    {urgentOrders.map((order) => (
                        <div key={order.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{order.customer}</h4>
                                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                            #{order.id}
                                        </span>
                                    </div>
                                    <span className="inline-block mt-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                        {order.deadline}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Thu hộ COD</span>
                                    <span className="font-bold text-[#00AFA9] text-sm sm:text-base">
                                        {order.cod > 0 ? `${order.cod.toLocaleString('vi-VN')} đ` : 'Đã thanh toán'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <MapPin className="w-4 h-4 text-[#00AFA9] shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{order.address}</span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <a
                                    href={`tel:${order.phone.replace(/\s+/g, '')}`}
                                    className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                                    Gọi khách
                                </a>
                                <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Navigation className="w-3.5 h-3.5 text-[#00AFA9]" />
                                    Bản đồ
                                </a>
                                <Link
                                    href="/shipper/deliveries"
                                    className="flex-1 py-2 px-3 bg-[#00AFA9] hover:bg-[#009b95] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                                >
                                    Chi tiết
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
