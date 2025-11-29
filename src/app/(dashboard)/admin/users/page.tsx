"use client";

import { useState } from "react";
import { mockUsers } from "@/mocks/data";
import { Plus, Pencil, Trash2 } from "lucide-react";

const ROLE_LABELS = {
    admin: "Admin",
    customer: "Khách hàng",
    sales: "Sales",
    ctv: "CTV",
};

const STATUS_LABELS = {
    active: "Hoạt động",
    inactive: "Ngưng hoạt động",
};

export default function UsersPage() {
    const [users] = useState(mockUsers);

    const handleAddUser = () => {
        console.log("Add User clicked");
        // TODO: Open modal or navigate to add user form
    };

    const handleEditUser = (userId: string) => {
        console.log("Edit user:", userId);
        // TODO: Open edit modal
    };

    const handleDeleteUser = (userId: string) => {
        console.log("Delete user:", userId);
        // TODO: Show confirmation dialog
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Danh sách tất cả người dùng trong hệ thống
                    </p>
                </div>
                <button
                    onClick={handleAddUser}
                    className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Thêm người dùng</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng người dùng</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{users.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Đang hoạt động</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {users.filter((u) => u.status === "active").length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Ngưng hoạt động</p>
                    <p className="text-2xl font-bold text-slate-400 mt-1">
                        {users.filter((u) => u.status === "inactive").length}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[640px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tên</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Vai trò</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{user.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            {ROLE_LABELS[user.role]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-slate-100 text-slate-600"
                                                }`}
                                        >
                                            {STATUS_LABELS[user.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEditUser(user.id)}
                                                className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Sửa"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
