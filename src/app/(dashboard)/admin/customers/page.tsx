"use client";

import { useState, useMemo, useEffect } from "react";
import { fetchUsers } from "@/lib/usersStore";
import { User } from "@/lib/usersStore";
import { Phone, Mail, MapPin, Loader2 } from "lucide-react";

const CUSTOMER_TYPES = ["Tất cả", "Tạp hóa", "Mini mart", "Đại lý", "NPP"] as const;

export default function CustomersPage() {
    const [selectedType, setSelectedType] = useState<string>("Tất cả");
    const [customers, setCustomers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const allUsers = await fetchUsers();
                // Filter only customers
                const justCustomers = allUsers.filter(u => u.role === 'customer');
                setCustomers(justCustomers);
            } catch (err) {
                console.error("Failed to load customers:", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const filteredCustomers = useMemo(() => {
        if (selectedType === "Tất cả") {
            return customers;
        }
        return customers.filter((c: any) => c.type === selectedType || (selectedType === "Khác" && !c.type));
    }, [selectedType, customers]);

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
                        const count = customers.filter((c: any) => c.type === type).length;
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">
                        Danh sách khách hàng
                        {!isLoading && (
                            <span className="ml-2 text-sm font-normal text-slate-500">
                                ({filteredCustomers.length} khách hàng)
                            </span>
                        )}
                    </h3>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-slate-500 mt-2">Đang tải danh sách khách hàng...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <MapPin className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Chưa có khách hàng nào</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">
                            Danh sách khách hàng đang trống. Nhân viên kinh doanh chưa cập nhật khách hàng nào lên hệ thống.
                        </p>
                    </div>
                ) : (
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
                                            <div className="font-medium text-slate-900">{customer.name}</div>
                                            {customer.address && (
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {customer.address}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.role === "admin"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-orange-100 text-orange-700"
                                                    }`}
                                            >
                                                {customer.role === 'customer' ? 'Khách hàng' : customer.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{customer.province || customer.region || "N/A"}</td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span className="text-sm">{customer.phone || "N/A"}</span>
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
                )}

                {/* Mobile hint */}
                <div className="p-4 text-xs text-slate-500 text-center border-t border-slate-200 sm:hidden">
                    Vuốt sang trái/phải để xem thêm
                </div>
            </div>
        </div>
    );
}
