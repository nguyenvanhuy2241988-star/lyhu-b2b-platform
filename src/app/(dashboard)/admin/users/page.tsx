"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { ROLES } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";

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
        try {
            if (!silent) setIsLoading(true);
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase credentials");

            const token = session?.access_token;

            const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&order=created_at.desc`, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token || supabaseKey}`
                }
            });

            if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`);
            const data = await res.json();

            setUsers(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [session?.access_token]);

    useEffect(() => {
        if (!session?.access_token) return;

        fetchUsers();

        // Realtime Subscription
        const channel = supabase
            .channel('admin_users_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    console.log('[UsersPage] Realtime change detected');
                    fetchUsers(true);
                }
            )
            .subscribe((status: string) => {
                console.log('[UsersPage] Channel status:', status);
                if (status === 'SUBSCRIBED') fetchUsers(true);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.access_token, fetchUsers]);

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ email: "", password: "", fullName: "", role: "telesales", status: "active" });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: "", // Empty means no change
            fullName: user.full_name || "",
            role: user.role,
            status: user.status
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Determine method and URL
            const method = editingUser ? "PUT" : "POST";
            const body = editingUser
                ? { ...formData, id: editingUser.id }
                : formData;

            const res = await fetch("/api/admin/users", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Có lỗi xảy ra");
            }

            toast.success(editingUser ? "Cập nhật thành công!" : "Tạo người dùng thành công!");
            setIsModalOpen(false);
            fetchUsers(); // Refresh list
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản ${user.email}? Hành động này không thể hoàn tác.`)) return;

        const toastId = toast.loading("Đang xóa...");
        try {
            const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Xóa thất bại");

            toast.success("Đã xóa người dùng", { id: toastId });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const filteredUsers = (users || []).filter(user =>
        (user.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Danh sách tất cả nhân sự và vai trò trong hệ thống
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Thêm người dùng mới</span>
                </button>
            </div>

            {/* Filter / Stats */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <input
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    className="border border-slate-300 rounded-lg px-4 py-2 w-full sm:w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="text-sm text-slate-500">
                    Tổng: <b>{users.length}</b> • Hoạt động: <b>{users.filter(u => u.status === 'active').length}</b>
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
                                    <th className="px-6 py-3 font-medium">Email / Đăng nhập</th>
                                    <th className="px-6 py-3 font-medium">Vai trò</th>
                                    <th className="px-6 py-3 font-medium">Trạng thái</th>
                                    <th className="px-6 py-3 font-medium">Ngày tham gia</th>
                                    <th className="px-6 py-3 font-medium text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{user.full_name || "Chưa đặt tên"}</td>
                                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'customer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${user.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                                {STATUS_LABELS[user.status] || user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(user.created_at).toLocaleDateString('vi-VN')}
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
                                {filteredUsers.length === 0 && (
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
