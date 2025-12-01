"use client";

import { useState, useMemo, useEffect } from "react";
import { Phone, MapPin, Filter } from "lucide-react";
import { CtvLead, loadLeads, updateLeadStatus, LeadStatus } from "@/lib/ctvLeads";

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
};

const STATUS_CONFIG = {
    NEW: { label: "Mới", color: "bg-blue-100 text-blue-700" },
    CONTACTED: { label: "Đã liên hệ", color: "bg-yellow-100 text-yellow-700" },
    CONVERTED: { label: "Đã chuyển đổi", color: "bg-green-100 text-green-700" },
};

const STATUS_OPTIONS = [
    { value: "all", label: "Tất cả" },
    { value: "NEW", label: "Mới" },
    { value: "CONTACTED", label: "Đã liên hệ" },
    { value: "CONVERTED", label: "Đã chuyển đổi" },
];

const AREAS = [
    "Tất cả",
    "Hà Đông, Hà Nội",
    "Thanh Xuân, Hà Nội",
    "Cầu Giấy, Hà Nội",
    "Đống Đa, Hà Nội",
    "Long Biên, Hà Nội",
];

export default function MyLeadsPage() {
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedArea, setSelectedArea] = useState("Tất cả");
    const [leads, setLeads] = useState<CtvLead[]>([]);

    useEffect(() => {
        const data = loadLeads();
        setLeads(data);
    }, []);

    const filteredLeads = useMemo(() => {
        if (!leads || !Array.isArray(leads)) {
            return [];
        }

        return leads.filter((lead) => {
            const statusMatch = selectedStatus === "all" || lead?.status === selectedStatus;
            const areaMatch = selectedArea === "Tất cả" || lead?.area === selectedArea;
            return statusMatch && areaMatch;
        });
    }, [leads, selectedStatus, selectedArea]);

    // Stats for each status
    const stats = {
        total: leads?.length || 0,
        new: leads?.filter((l) => l?.status === "NEW")?.length || 0,
        contacted: leads?.filter((l) => l?.status === "CONTACTED")?.length || 0,
        converted: leads?.filter((l) => l?.status === "CONVERTED")?.length || 0,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Danh sách Leads</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Quản lý tất cả leads của bạn
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng leads</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Mới</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.new}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Đã liên hệ</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.contacted}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Đã chuyển đổi</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.converted}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Lọc leads</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-600 mb-2 font-medium">Trạng thái</label>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSelectedStatus(option.value)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedStatus === option.value
                                        ? "bg-primary-500 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-2 font-medium">Khu vực</label>
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {AREAS.map((area) => (
                                <option key={area} value={area}>
                                    {area}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">
                        Danh sách leads
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({filteredLeads.length} leads)
                        </span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tên cửa hàng</th>
                                <th className="px-6 py-3 font-medium">Liên hệ</th>
                                <th className="px-6 py-3 font-medium">Khu vực</th>
                                <th className="px-6 py-3 font-medium">Loại</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredLeads.map((lead) => {
                                const statusConfig = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG];
                                return (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{lead.storeName}</div>
                                            {lead.note && (
                                                <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                    {lead.note}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="text-slate-900">{lead.contactName}</div>
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    <span className="text-xs">{lead.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="text-sm">{lead.area}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.customerType === "NPP"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : lead.customerType === "Đại lý"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : lead.customerType === "Mini mart"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-orange-100 text-orange-700"
                                                    }`}
                                            >
                                                {lead.customerType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={lead.status}
                                                onChange={(e) => {
                                                    const status = e.target.value as LeadStatus;
                                                    const updated = updateLeadStatus(lead.id, status);
                                                    setLeads(updated);
                                                }}
                                                className="px-2.5 py-0.5 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-primary-500 bg-blue-100 text-blue-700"
                                            >
                                                <option value="NEW">Mới</option>
                                                <option value="CONTACTED">Đã liên hệ</option>
                                                <option value="CONVERTED">Đã chuyển đổi</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(lead.createdAt)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredLeads.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        Không tìm thấy lead nào
                    </div>
                )}

                {/* Mobile hint */}
                <div className="p-4 text-xs text-slate-500 text-center border-t border-slate-200 sm:hidden">
                    Vuốt sang trái/phải để xem thêm
                </div>
            </div>
        </div>
    );
}
