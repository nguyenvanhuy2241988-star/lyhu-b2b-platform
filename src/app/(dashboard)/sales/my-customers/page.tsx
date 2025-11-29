"use client";

import { useState, useMemo } from "react";
import { mockCustomers } from "@/mocks/data";
import { Phone, Mail, MapPin, DollarSign } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const CUSTOMER_TYPES = ["Tất cả", "Tạp hóa", "Mini mart", "Đại lý", "NPP"] as const;
const AREAS = ["Tất cả", "Quận 1, TP.HCM", "Quận 3, TP.HCM", "Quận 5, TP.HCM", "Bình Dương", "Đồng Nai", "Long An"];

// Mock last order data for each customer
const customerOrderData: Record<string, { lastOrderTotal: number; lastOrderDate: string }> = {
    "1": { lastOrderTotal: 2500000, lastOrderDate: "2024-11-25" },
    "2": { lastOrderTotal: 3200000, lastOrderDate: "2024-11-28" },
    "3": { lastOrderTotal: 4500000, lastOrderDate: "2024-11-20" },
    "4": { lastOrderTotal: 8500000, lastOrderDate: "2024-11-29" },
    "5": { lastOrderTotal: 1800000, lastOrderDate: "2024-11-22" },
    "6": { lastOrderTotal: 2100000, lastOrderDate: "2024-11-26" },
    "7": { lastOrderTotal: 3800000, lastOrderDate: "2024-11-27" },
    "8": { lastOrderTotal: 7200000, lastOrderDate: "2024-11-24" },
};

export default function MyCustomersPage() {
    const [selectedType, setSelectedType] = useState<string>("Tất cả");
    const [selectedArea, setSelectedArea] = useState<string>("Tất cả");

    const filteredCustomers = useMemo(() => {
        if (!mockCustomers || !Array.isArray(mockCustomers)) {
            return [];
        }

        return mockCustomers.filter((customer) => {
            const typeMatch = selectedType === "Tất cả" || customer.type === selectedType;
            const areaMatch = selectedArea === "Tất cả" || customer.area === selectedArea;
            return typeMatch && areaMatch;
        });
    }, [selectedType, selectedArea]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Khách hàng của tôi</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Danh sách khách hàng đang phụ trách
                </p>
            </div>

            {/* Stats & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Stats */}
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {CUSTOMER_TYPES.slice(1).map((type) => {
                        const count = mockCustomers?.filter((c) => c.type === type)?.length || 0;
                        return (
                            <div key={type} className="bg-white p-4 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-600">{type}</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{count}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <label className="block text-xs text-slate-600 mb-2 font-medium">Lọc theo loại</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            {CUSTOMER_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <label className="block text-xs text-slate-600 mb-2 font-medium">Lọc theo khu vực</label>
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">
                        Danh sách khách hàng
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({filteredCustomers.length} khách hàng)
                        </span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tên cửa hàng</th>
                                <th className="px-6 py-3 font-medium">Loại hình</th>
                                <th className="px-6 py-3 font-medium">Khu vực</th>
                                <th className="px-6 py-3 font-medium">Liên hệ</th>
                                <th className="px-6 py-3 font-medium text-right">Đơn gần nhất</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredCustomers.map((customer) => {
                                const orderData = customerOrderData[customer.id] || {
                                    lastOrderTotal: 0,
                                    lastOrderDate: ""
                                };

                                return (
                                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{customer.storeName}</div>
                                            {customer.address && (
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {customer.address}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.type === "NPP"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : customer.type === "Đại lý"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : customer.type === "Mini mart"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-orange-100 text-orange-700"
                                                    }`}
                                            >
                                                {customer.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{customer.area}</td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span className="text-sm">{customer.phone}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Mail className="w-4 h-4" />
                                                        <span className="text-xs">{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1 text-primary-600 font-semibold">
                                                    <DollarSign className="w-4 h-4" />
                                                    <span>{formatPrice(orderData.lastOrderTotal)}</span>
                                                </div>
                                                {orderData.lastOrderDate && (
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        {new Date(orderData.lastOrderDate).toLocaleDateString("vi-VN")}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredCustomers.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        Không tìm thấy khách hàng nào
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
