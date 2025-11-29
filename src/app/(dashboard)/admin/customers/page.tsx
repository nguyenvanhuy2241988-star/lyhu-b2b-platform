"use client";

import { useState, useMemo } from "react";
import { mockCustomers } from "@/mocks/data";
import { Phone, Mail, MapPin } from "lucide-react";

const CUSTOMER_TYPES = ["Tất cả", "Tạp hóa", "Mini mart", "Đại lý", "NPP"] as const;

export default function CustomersPage() {
    const [selectedType, setSelectedType] = useState<string>("Tất cả");

    const filteredCustomers = useMemo(() => {
        if (selectedType === "Tất cả") {
            return mockCustomers;
        }
        return mockCustomers.filter((c) => c.type === selectedType);
    }, [selectedType]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý khách hàng</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Danh sách khách hàng B2B (GT/MT)
                </p>
            </div>

            {/* Stats & Filter */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {CUSTOMER_TYPES.slice(1).map((type) => {
                        const count = mockCustomers.filter((c) => c.type === type).length;
                        return (
                            <div key={type} className="bg-white p-4 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-600">{type}</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{count}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Filter */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <label className="block text-xs text-slate-600 mb-2">Lọc theo loại</label>
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
                    <table className="w-full text-left text-sm min-w-[768px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tên cửa hàng</th>
                                <th className="px-6 py-3 font-medium">Loại hình</th>
                                <th className="px-6 py-3 font-medium">Khu vực</th>
                                <th className="px-6 py-3 font-medium">Liên hệ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredCustomers.map((customer) => (
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile hint */}
                <div className="p-4 text-xs text-slate-500 text-center border-t border-slate-200 sm:hidden">
                    Vuốt sang trái/phải để xem thêm
                </div>
            </div>
        </div>
    );
}
