'use client';

import React, { useState } from "react";
import { Search, MapPin, Phone, CheckCircle2, Navigation, AlertCircle, ArrowLeft, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

const INITIAL_DELIVERIES = [
    { id: 'ORD-7721', customer: 'Trần Văn A', phone: '0912345678', address: 'Số 10, Ngõ 5, Cầu Giấy, Hà Nội', cod: 250000, status: 'PENDING', note: 'Giao giờ hành chính, gọi trước 15p' },
    { id: 'ORD-8812', customer: 'Lê Thị B', phone: '0987654321', address: 'Tòa nhà Landmark 72, Nam Từ Liêm, Hà Nội', cod: 0, status: 'DELIVERING', note: 'Gửi lễ tân tầng 1' },
    { id: 'ORD-9911', customer: 'Hoàng Văn C', phone: '0901112233', address: 'Chung cư Times City, Hai Bà Trưng, Hà Nội', cod: 1200000, status: 'PENDING', note: 'Khách thanh toán chuyển khoản hoặc tiền mặt' },
    { id: 'ORD-9915', customer: 'Phạm Hồng Nhung', phone: '0933221100', address: '45 Lê Duẩn, Hoàn Kiếm, Hà Nội', cod: 540000, status: 'COMPLETED', note: 'Đã hoàn tất lúc 09:15' },
];

export default function ShipperDeliveriesPage() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const handleMarkDelivered = (id: string) => {
        const confirmed = confirm("Xác nhận đã giao thành công đơn hàng này?");
        if (!confirmed) return;

        setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: 'COMPLETED' } : d));
    };

    const handleMarkDelivering = (id: string) => {
        setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: 'DELIVERING' } : d));
    };

    const filteredDeliveries = deliveries.filter(d => {
        const matchesSearch = d.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.phone.includes(searchTerm) ||
            d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.address.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const pendingCount = deliveries.filter(d => d.status === 'PENDING').length;
    const deliveringCount = deliveries.filter(d => d.status === 'DELIVERING').length;
    const completedCount = deliveries.filter(d => d.status === 'COMPLETED').length;

    return (
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        title="Quay lại"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-[#00AFA9]" /> Danh sách cần giao
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                            {deliveries.length} đơn hàng trong tuyến giao hôm nay
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                    {[
                        { key: 'all', label: `Tất cả (${deliveries.length})` },
                        { key: 'PENDING', label: `Chờ giao (${pendingCount})` },
                        { key: 'DELIVERING', label: `Đang đi (${deliveringCount})` },
                        { key: 'COMPLETED', label: `Đã xong (${completedCount})` },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                statusFilter === tab.key
                                    ? 'bg-[#00AFA9] text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00AFA9] transition-colors"
                    placeholder="Tìm theo tên khách, số điện thoại, mã đơn, địa chỉ..."
                />
            </div>

            {/* Delivery List */}
            <div className="space-y-3">
                {filteredDeliveries.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                        <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs sm:text-sm font-semibold text-slate-600">Không tìm thấy đơn hàng nào phù hợp</p>
                    </div>
                ) : (
                    filteredDeliveries.map(dev => (
                        <div key={dev.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 hover:border-slate-300 transition-colors">
                            {/* Card Top */}
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">{dev.customer}</h3>
                                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                            #{dev.id}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">{dev.phone}</div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        dev.status === 'COMPLETED'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : dev.status === 'DELIVERING'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {dev.status === 'COMPLETED' ? 'Đã giao' : dev.status === 'DELIVERING' ? 'Đang giao' : 'Chờ giao'}
                                    </span>
                                    <div className="mt-1 font-bold text-[#00AFA9] text-xs sm:text-sm">
                                        {dev.cod > 0 ? `COD: ${dev.cod.toLocaleString('vi-VN')} đ` : 'Đã thanh toán (0 đ)'}
                                    </div>
                                </div>
                            </div>

                            {/* Address & Note */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs">
                                <div className="flex items-start gap-2 text-slate-700">
                                    <MapPin className="w-3.5 h-3.5 text-[#00AFA9] shrink-0 mt-0.5" />
                                    <span>{dev.address}</span>
                                </div>
                                {dev.note && (
                                    <p className="text-slate-500 text-[11px] italic pl-5.5">
                                        Ghi chú: {dev.note}
                                    </p>
                                )}
                            </div>

                            {/* Touch Actions */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <a
                                    href={`tel:${dev.phone}`}
                                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                                    Gọi điện
                                </a>
                                <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(dev.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 transition-colors"
                                >
                                    <Navigation className="w-3.5 h-3.5 text-[#00AFA9]" />
                                    Chỉ đường
                                </a>
                                {dev.status === 'COMPLETED' ? (
                                    <div className="flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
                                    </div>
                                ) : dev.status === 'DELIVERING' ? (
                                    <button
                                        onClick={() => handleMarkDelivered(dev.id)}
                                        className="flex items-center justify-center gap-1 py-2 rounded-lg bg-[#00AFA9] hover:bg-[#009b95] text-white font-bold text-xs transition-colors"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã giao
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleMarkDelivering(dev.id)}
                                        className="flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-xs transition-colors"
                                    >
                                        Bắt đầu đi
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
