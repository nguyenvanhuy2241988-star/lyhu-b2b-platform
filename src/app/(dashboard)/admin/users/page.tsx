"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { ROLES } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchPaginatedUsers, AdminUser as AdminUserType } from "@/lib/admin/users";
import { useDebounce } from "use-debounce";


// Helper for Vietnamese Role Names
const ROLE_LABELS: Record<string, string> = {
    [ROLES.ADMIN]: "Quản trị viên (Admin)",
    [ROLES.CUSTOMER]: "Khách hàng",
    [ROLES.SALES]: "Sales (Kinh doanh)",
    [ROLES.CTV]: "Cộng tác viên (CTV)",
    [ROLES.TELESALES]: "Telesales (Chăm sóc KH)",
    [ROLES.RECRUITER]: "Tuyển dụng (HR)",
    [ROLES.WAREHOUSE]: "Kho vận (Warehouse)",
    [ROLES.MARKETING]: "Marketing",
    [ROLES.ECOMMERCE]: "Thương mại điện tử",
    [ROLES.RND]: "R&D (Nghiên cứu)",
    [ROLES.SHIPPER]: "Vận chuyển (Shipper)",
    [ROLES.ACCOUNTANT]: "Kế toán",
    [ROLES.SALE_ADMIN]: "Sale Admin",
    [ROLES.LIVESTREAM]: "Livestream",
};

const STATUS_LABELS: Record<string, string> = {
    active: "Hoạt động",
    inactive: "Ngưng hoạt động",
};

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
        role: "telesales", // Default
        status: "active"
    });

    const { session } = useAuth();

    const fetchUsers = useCallback(async (silent = false) => {
        if (!session?.access_token) return;

        try {
            if (!silent) setIsLoading(true);

            // Use the new RPC to get users with activity stats
            const { data, error } = await supabase.rpc('get_users_activity_stats');

            if (error) throw error;

            setUsers(data || []);
            setTotalCount(data?.length || 0);

        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [session?.access_token]);

    // ... (keep useEffects)

    // Helper to format seconds to HH:mm
    const formatDuration = (seconds: number) => {
        if (!seconds) return "0p";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}p` : `${m}p`;
    };

    const formatLastSeen = (dateString: string | null) => {
        if (!dateString) return "Chưa có";
        return new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    // Filter logic needs to be client-side since RPC returns all
    const filteredUsers = (users || []).filter(user =>
        (user.full_name || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    // Client-side pagination
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-6">
            {/* ... (Header & Stats remain similar) ... */}

            {/* Replace Stats/Filter section slightly to remove server-side total count dependence if needed, 
                 but totalCount logic in fetch above handles it. */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                {/* ... (Search input same) ... */}
                <input
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    className="border border-slate-300 rounded-lg px-4 py-2 w-full sm:w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="text-sm text-slate-500">
                    Tổng: <b>{filteredUsers.length}</b> • Hiển thị: <b>{paginatedUsers.length}</b>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center text-slate-500">Đang tải dữ liệu...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[900px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Họ & Tên</th>
                                    <th className="px-6 py-3 font-medium">Trạng thái Online</th>
                                    <th className="px-6 py-3 font-medium">Thời gian h.động</th>
                                    <th className="px-6 py-3 font-medium">Vai trò</th>
                                    <th className="px-6 py-3 font-medium">Cập nhật cuối</th>
                                    <th className="px-6 py-3 font-medium text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {paginatedUsers.map((user: any) => (
                                    <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{user.email}</div>
                                            <div className="text-xs text-slate-500">{user.full_name || "Chưa đặt tên"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${user.is_online
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                {user.is_online ? "Online" : "Offline"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-slate-700 font-medium">
                                                {formatDuration(user.online_seconds)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'customer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {formatLastSeen(user.last_seen)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa tài khoản"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500">
                                            Không tìm thấy người dùng nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination UI */}
            {!isLoading && totalCount > pageSize && (
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-200">
                    <div className="text-sm text-slate-500">
                        Hiển thị <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> trong tổng số <span className="font-medium">{totalCount}</span> nhân sự
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Trước
                        </button>
                        <div className="flex items-center px-4 text-sm font-medium text-slate-700">
                            Trang {currentPage} / {Math.ceil(totalCount / pageSize)}
                        </div>
                        <button
                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingUser ? "Chỉnh sửa nhân sự" : "Thêm nhân sự mới"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    disabled={!!editingUser} // Disable email edit for simplicity
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="vd: nhanvien@lyhu.vn"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {editingUser ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
                                </label>
                                <input
                                    required={!editingUser}
                                    type="text"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder={editingUser ? "Nhập mật khẩu mới..." : "Nhập mật khẩu..."}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                {!editingUser && <p className="text-xs text-slate-500 mt-1">Mật khẩu tối thiểu 6 ký tự</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên</label>
                                <input
                                    required
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="vd: Nguyễn Văn A"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Ngưng hoạt động</option>
                                    </select>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                                    ) : (
                                        <><Check className="w-4 h-4" /> {editingUser ? "Cập nhật" : "Tạo tài khoản"}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
