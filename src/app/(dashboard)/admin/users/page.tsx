"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Pencil, Trash2, X, Loader2, Check, BarChart3, Smartphone, Monitor, User as UserIcon, Clock, Activity, FileText, CheckCircle, KeyRound, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { ROLES } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchPaginatedUsers, AdminUser as AdminUserType } from "@/lib/admin/users";
import { useDebounce } from "use-debounce";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

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
    [ROLES.SALES_GT]: "Sales GT (Thị trường)",
    [ROLES.MEDIA_CREATOR]: "Media (Ảnh/Video)",
};

const STATUS_LABELS: Record<string, string> = {
    active: "Hoạt động",
    inactive: "Ngưng hoạt động",
};

interface User {
    id: string; // Mapped from user_id if from RPC
    user_id?: string; // Raw from RPC
    email: string;
    full_name: string;
    role: string;
    status: string;
    misa_employee_code?: string; // Add this field
    misa_branch_code?: string; // Add MISA Organization Unit code
    zalo_phone?: string;
    zalo_password?: string;
    zalo_backup_password?: string;
    login_password?: string;
    created_at: string;
    // Activity Stats
    online_seconds: number;
    last_seen: string | null;
    is_online: boolean;
    last_path: string | null;
    device_info: string | null;
    can_use_bot_center?: boolean;
}

type TimeRange = '7d' | '30d' | '1y' | '3y' | '5y';
type ModalTab = 'overview' | 'activity_log';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState<ModalTab>('overview');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    // Password Reset State
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
    const [resetPassword, setResetPassword] = useState("");
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    // Chart State
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');

    // Activity Logs State
    // Activity Logs State
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [logDateStart, setLogDateStart] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0); // Start of today
        return d.toISOString().split('T')[0];
    });
    const [logDateEnd, setLogDateEnd] = useState(() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999); // End of today
        return d.toISOString().split('T')[0];
    });



    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
        role: "telesales", // Default
        status: "active",
        misa_employee_code: "",
        misa_branch_code: "NB", // Default to NB
        zalo_phone: "",
        zalo_password: "",
        zalo_backup_password: "",
        can_use_bot_center: false
    });

    const { session } = useAuth();

    const fetchUsers = useCallback(async (silent = false) => {
        if (!session?.access_token) return;

        try {
            if (!silent) setIsLoading(true);

            // Use the new RPC to get users with activity stats
            const { data, error } = await supabase.rpc('get_users_activity_stats');

            if (error) throw error;

            // Normalize ID
            const normalizedData = (data || []).map((u: any) => ({
                ...u,
                id: u.user_id
            }));

            setUsers(normalizedData);
            setTotalCount(normalizedData.length);

        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [session?.access_token]);

    const fetchUserHistory = async (userId: string, range: TimeRange) => {
        setIsLoadingHistory(true);
        try {
            let days = 7;
            let interval = 'day';

            switch (range) {
                case '7d': days = 7; interval = 'day'; break;
                case '30d': days = 30; interval = 'day'; break;
                case '1y': days = 365; interval = 'month'; break;
                case '3y': days = 365 * 3; interval = 'month'; break;
                case '5y': days = 365 * 5; interval = 'month'; break;
            }

            const { data, error } = await supabase.rpc('get_user_activity_history', {
                p_user_id: userId,
                p_days: days,
                p_interval: interval
            });
            if (error) throw error;
            setHistoryData(data || []);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi tải lịch sử");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const fetchActivityLogs = async (userId: string) => {
        setIsLoadingLogs(true);
        try {
            let query = supabase
                .from('crm_activities')
                .select('*, deal:crm_deals(title)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (logDateStart) {
                query = query.gte('created_at', `${logDateStart}T00:00:00`);
            }
            if (logDateEnd) {
                query = query.lte('created_at', `${logDateEnd}T23:59:59`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setActivityLogs(data || []);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi tải nhật ký hoạt động");
        } finally {
            setIsLoadingLogs(false);
        }
    };



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
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.access_token, fetchUsers]);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, selectedRole, selectedStatus]);

    // Fetch history when dragging range
    useEffect(() => {
        if (viewingUser && isDetailOpen) {
            if (currentTab === 'overview') {
                fetchUserHistory(viewingUser.id, timeRange);
            } else if (currentTab === 'activity_log') {
                fetchActivityLogs(viewingUser.id);
            }
        }
    }, [timeRange, viewingUser, isDetailOpen, currentTab, logDateStart, logDateEnd]); // Trigger fetch on date change

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ email: "", password: "", fullName: "", role: "telesales", status: "active", misa_employee_code: "", misa_branch_code: "NB", zalo_phone: "", zalo_password: "", zalo_backup_password: "", can_use_bot_center: false });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: "", // Empty means no change
            fullName: user.full_name || "",
            role: user.role,
            status: user.status,
            misa_employee_code: user.misa_employee_code || "",
            misa_branch_code: user.misa_branch_code || "NB",
            zalo_phone: user.zalo_phone || "",
            zalo_password: user.zalo_password || "",
            zalo_backup_password: user.zalo_backup_password || "",
            can_use_bot_center: user.can_use_bot_center || false
        });
        setIsModalOpen(true);
    };

    const handleViewDetail = (user: User) => {
        setViewingUser(user);
        setTimeRange('7d'); // Reset default
        setCurrentTab('overview');
        setIsDetailOpen(true);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const method = editingUser ? "PUT" : "POST";
            const body = editingUser ? { ...formData, id: editingUser.id } : formData;

            const res = await fetch("/api/admin/users", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");

            toast.success(editingUser ? "Cập nhật thành công!" : "Tạo người dùng thành công!");
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản ${user.email}?`)) return;

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

    const handleOpenResetPassword = (user: User) => {
        setResetPasswordUser(user);
        setResetPassword("");
        setShowResetPassword(false);
        setIsResetPasswordOpen(true);
    };

    const handleResetPassword = async () => {
        if (!resetPasswordUser || !resetPassword || resetPassword.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }
        setIsResettingPassword(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: resetPasswordUser.id,
                    email: resetPasswordUser.email,
                    password: resetPassword,
                    fullName: resetPasswordUser.full_name,
                    role: resetPasswordUser.role,
                    status: resetPasswordUser.status
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
            toast.success(`Đã đặt lại mật khẩu cho ${resetPasswordUser.email}`);
            setIsResetPasswordOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsResettingPassword(false);
        }
    };

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
    const filteredUsers = (users || []).filter(user => {
        const term = debouncedSearchTerm.toLowerCase();
        const matchesSearch = 
            (user.full_name || "").toLowerCase().includes(term) ||
            (user.email || "").toLowerCase().includes(term) ||
            (user.zalo_phone || "").toLowerCase().includes(term) ||
            (user.misa_employee_code || "").toLowerCase().includes(term);
            
        const matchesRole = selectedRole === "all" || user.role === selectedRole;
        
        let matchesStatus = true;
        if (selectedStatus === "online") matchesStatus = user.is_online === true;
        if (selectedStatus === "offline") matchesStatus = user.is_online === false;
        
        return matchesSearch && matchesRole && matchesStatus;
    });

    // Client-side pagination
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Chart Components
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dateStr = ['1y', '3y', '5y'].includes(timeRange)
                ? new Date(label).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
                : new Date(label).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

            return (
                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-xs z-50">
                    <p className="font-bold text-slate-800 mb-1">{dateStr}</p>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-slate-500">Hoạt động:</span>
                        <span className="font-bold text-blue-700">{formatDuration(payload[0].value)}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Avg Stats
    const avgDaily = useMemo(() => {
        if (!historyData.length) return 0;
        const total = historyData.reduce((acc, curr) => acc + (curr.online_seconds || 0), 0);
        return Math.floor(total / historyData.length);
    }, [historyData]);

    return (
        <div className="space-y-6">
            {/* ... (Header & Stats) ... */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Theo dõi hoạt động và phân quyền nhân sự
                    </p>
                </div>
                <button onClick={handleOpenCreate} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-all">
                    <Plus className="w-5 h-5" />
                    <span>Thêm nhân sự</span>
                </button>
            </div>

            {/* Filter section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
                    <input
                        placeholder="Tìm kiếm theo tên, email, SĐT, mã MISA..."
                        className="border border-slate-300 rounded-lg px-4 py-2 w-full sm:flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="border border-slate-300 rounded-lg px-4 py-2 w-full sm:w-48 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={selectedRole}
                        onChange={e => setSelectedRole(e.target.value)}
                    >
                        <option value="all">Tất cả vai trò</option>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <select
                        className="border border-slate-300 rounded-lg px-4 py-2 w-full sm:w-48 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="online">Đang Online</option>
                        <option value="offline">Offline</option>
                    </select>
                </div>
                <div className="text-sm text-slate-500 flex justify-end">
                    Tổng: <b className="ml-1">{filteredUsers.length}</b> <span className="mx-2">•</span> Hiển thị: <b className="ml-1">{paginatedUsers.length}</b>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center text-slate-500">Đang tải dữ liệu...</div>
                ) : (
                    <>
                        {/* Mobile View (Cards) */}
                        <div className="grid grid-cols-1 gap-4 p-4 lg:hidden bg-slate-50">
                            {paginatedUsers.map((user: any) => (
                                <div key={user.user_id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform" onClick={() => handleViewDetail(user)}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{user.full_name || "Chưa đặt tên"}</div>
                                                <div className="text-xs text-slate-500 max-w-[150px] truncate">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleOpenEdit(user)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg active:bg-slate-100"><Pencil className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(user)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg active:bg-slate-100"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Trạng thái:</span>
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider
                                                ${user.is_online
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                {user.is_online ? "Online" : "Offline"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Vai trò:</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider
                                                ${user.role === 'admin' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                                    user.role === 'customer' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                                                }`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Mã MISA:</span>
                                            <span className="font-mono text-xs font-medium text-slate-700">{user.misa_employee_code || "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View (Table) */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[900px]">
                                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Họ & Tên</th>
                                        <th className="px-6 py-3 font-medium">Tài khoản Zalo</th>
                                        <th className="px-6 py-3 font-medium">Mã MISA</th> {/* New Column */}
                                        <th className="px-6 py-3 font-medium">Trạng thái</th>
                                        <th className="px-6 py-3 font-medium">Hoạt động</th>
                                        <th className="px-6 py-3 font-medium">Vai trò</th>
                                        <th className="px-6 py-3 font-medium">Chi tiết</th>
                                        <th className="px-6 py-3 font-medium text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {paginatedUsers.map((user: any) => (
                                        <tr key={user.user_id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleViewDetail(user)}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{user.full_name || user.email}</div>
                                                <div className="text-xs text-slate-500">{user.full_name ? user.email : "Chưa đặt tên"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.zalo_phone ? (
                                                    <div className="font-medium text-blue-600">{user.zalo_phone}</div>
                                                ) : (
                                                    <div className="text-slate-400 text-xs italic">Chưa cấp</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-slate-600">
                                                <div>{user.misa_employee_code || "-"}</div>
                                                {user.misa_branch_code && (
                                                    <div className="text-[10px] text-slate-400 mt-0.5">Unit: {user.misa_branch_code}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                        ${user.is_online
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                            : 'bg-slate-50 text-slate-500 border-slate-100'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                        {user.is_online ? "Online" : "Offline"}
                                                    </span>
                                                    {user.is_online && user.last_path && (
                                                        <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={user.last_path}>
                                                            {user.last_path}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-slate-700 font-medium">
                                                    {formatDuration(user.online_seconds)}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                    {user.device_info == 'Mobile' ? <Smartphone size={10} /> : <Monitor size={10} />}
                                                    {user.device_info || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'customer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {ROLE_LABELS[user.role] || user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {formatLastSeen(user.last_seen)}
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => handleOpenResetPassword(user)}
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Đặt lại mật khẩu"
                                                    >
                                                        <KeyRound className="w-4 h-4" />
                                                    </button>
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
                                </tbody>
                            </table>
                        </div>
                    </>
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

            {/* Detail Modal */}
            {isDetailOpen && viewingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
                    <div className="bg-white rounded-none sm:rounded-xl shadow-xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 h-full sm:h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    {viewingUser.full_name || viewingUser.email}
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${viewingUser.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {viewingUser.is_online ? 'Online' : 'Offline'}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500">{viewingUser.role.toUpperCase()} • {viewingUser.email}</p>
                            </div>
                            <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 border-b border-slate-100 flex gap-6">
                            <button
                                onClick={() => setCurrentTab('overview')}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start ${currentTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <BarChart3 className="w-4 h-4 hidden sm:block" />
                                Tổng quan
                            </button>
                            <button
                                onClick={() => setCurrentTab('activity_log')}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start ${currentTab === 'activity_log' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <Activity className="w-4 h-4 hidden sm:block" />
                                Nhật ký
                            </button>

                        </div>

                        <div className="p-6 overflow-y-auto flex-1 font-sans">
                            {currentTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <p className="text-blue-600 text-xs font-medium uppercase">Hôm nay</p>
                                            <p className="text-2xl font-bold text-slate-800 mt-1">{formatDuration(viewingUser.online_seconds)}</p>
                                        </div>
                                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                            <p className="text-indigo-600 text-xs font-medium uppercase">Trung bình / ngày</p>
                                            <p className="text-2xl font-bold text-slate-800 mt-1">{formatDuration(avgDaily)}</p>
                                            <p className="text-[10px] text-slate-400">Trong thời gian đã chọn</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                            <p className="text-slate-500 text-xs font-medium uppercase">Cập nhật cuối</p>
                                            <p className="text-lg font-semibold text-slate-700 mt-1">{formatLastSeen(viewingUser.last_seen)}</p>
                                            {viewingUser.last_path && <p className="text-xs text-slate-400 mt-1 truncate">{viewingUser.last_path}</p>}
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                            <p className="text-slate-500 text-xs font-medium uppercase">Thiết bị</p>
                                            <p className="text-lg font-semibold text-slate-700 mt-1 flex items-center gap-2">
                                                {viewingUser.device_info == 'Mobile' ? <Smartphone size={18} /> : <Monitor size={18} />}
                                                {viewingUser.device_info || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Chart Header & Filters */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-blue-600" />
                                            Lịch sử hoạt động
                                        </h4>
                                        <div className="flex bg-slate-100 p-1 rounded-lg">
                                            {(['7d', '30d', '1y', '3y', '5y'] as TimeRange[]).map((range) => (
                                                <button
                                                    key={range}
                                                    onClick={() => setTimeRange(range)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === range
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                >
                                                    {range === '1y' ? '1 Năm' : range === '3y' ? '3 Năm' : range === '5y' ? '5 Năm' : range === '30d' ? '30 Ngày' : '7 Ngày'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Chart Area */}
                                    <div className="h-[350px] w-full border border-slate-100 rounded-xl p-4 bg-white relative">
                                        {isLoadingHistory ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey={['1y', '3y', '5y'].includes(timeRange) ? "agg_date" : "date"}
                                                        fontSize={11}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(value) => {
                                                            const date = new Date(value);
                                                            if (['1y', '3y', '5y'].includes(timeRange)) {
                                                                return date.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' });
                                                            }
                                                            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                                                        }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        fontSize={11}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(val) => {
                                                            const hours = val / 3600;
                                                            return hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.floor(val / 60)}p`
                                                        }}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Area
                                                        type="monotone"
                                                        dataKey={['1y', '3y', '5y'].includes(timeRange) ? "total_seconds" : "online_seconds"}
                                                        stroke="#3b82f6"
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill="url(#colorOnline)"
                                                        animationDuration={1000}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>

                                    {/* Annotation */}
                                    {['1y', '3y', '5y'].includes(timeRange) && (
                                        <p className="text-center text-xs text-slate-400 mt-2 italic">
                                            * Dữ liệu được tổng hợp theo tháng để tối ưu hiệu năng
                                        </p>
                                    )}
                                </div>
                            )}

                            {currentTab === 'activity_log' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-blue-600" />
                                            Timeline hoạt động ({activityLogs.length})
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                <input
                                                    type="date"
                                                    value={logDateStart}
                                                    onChange={e => setLogDateStart(e.target.value)}
                                                    className="bg-transparent text-sm border-none focus:ring-0 px-2 py-1 text-slate-600 outline-none cursor-pointer"
                                                />
                                                <span className="text-slate-400">-</span>
                                                <input
                                                    type="date"
                                                    value={logDateEnd}
                                                    onChange={e => setLogDateEnd(e.target.value)}
                                                    className="bg-transparent text-sm border-none focus:ring-0 px-2 py-1 text-slate-600 outline-none cursor-pointer"
                                                />
                                            </div>
                                            <button onClick={() => viewingUser && fetchActivityLogs(viewingUser.id)} className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors">
                                                <Loader2 className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {isLoadingLogs ? (
                                        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                                    ) : activityLogs.length === 0 ? (
                                        <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            Chưa có hoạt động nào được ghi nhận
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pl-8 py-2">
                                            {activityLogs.map((log) => (
                                                <div key={log.id} className="relative">
                                                    {/* Dot */}
                                                    <div className={`absolute -left-[39px] text-white rounded-full p-1.5 border-4 border-white shadow-sm
                                                        ${log.type === 'call' ? 'bg-green-500' :
                                                            log.type === 'system' ? 'bg-purple-500' :
                                                                log.type === 'note' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                                        {log.type === 'call' ? <Smartphone size={14} /> :
                                                            log.type === 'system' ? <Activity size={14} /> :
                                                                log.type === 'note' ? <FileText size={14} /> : <CheckCircle size={14} />}
                                                    </div>

                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                {new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                <span className="mx-2">•</span>
                                                                {new Date(log.created_at).toLocaleDateString('vi-VN')}
                                                            </span>
                                                            <span className="text-[10px] bg-white px-2 py-1 rounded border text-slate-400">
                                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: vi })}
                                                            </span>
                                                        </div>
                                                        <h5 className="font-bold text-slate-800 text-sm mb-1">{log.subject}</h5>
                                                        <p className="text-sm text-slate-600 mb-2">{log.description}</p>
                                                        {log.deal && (
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border rounded text-xs text-blue-600 font-medium">
                                                                <Activity size={12} />
                                                                Deal: {log.deal.title}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}


                        </div>
                    </div>
                </div>
            )
            }

            {/* Create/Edit Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
                        <div className="bg-white rounded-none sm:rounded-xl shadow-xl w-full h-full sm:h-auto sm:max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                                <h3 className="font-bold text-lg text-slate-800">
                                    {editingUser ? "Chỉnh sửa nhân sự" : "Thêm nhân sự mới"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        disabled={!!editingUser}
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mã nhân viên (MISA)</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="vd: NV000123"
                                            value={formData.misa_employee_code}
                                            onChange={e => setFormData({ ...formData, misa_employee_code: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị / Chi nhánh (MISA)</label>
                                        <select
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            value={formData.misa_branch_code}
                                            onChange={e => setFormData({ ...formData, misa_branch_code: e.target.value })}
                                        >
                                            <option value="NB">Miền Bắc</option>
                                            <option value="MT">Miền Trung</option>
                                            <option value="MN">Miền Nam</option>
                                            <option value="CTY">Công ty tổng</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Zalo Info */}
                                <div className="border-t border-slate-200 pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-blue-600" />
                                        Tài khoản Zalo cấp phát
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại Zalo</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="vd: 0987654321"
                                                value={formData.zalo_phone}
                                                onChange={e => setFormData({ ...formData, zalo_phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu Zalo</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                                    placeholder="Mật khẩu đăng nhập"
                                                    value={formData.zalo_password}
                                                    onChange={e => setFormData({ ...formData, zalo_password: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu sao lưu</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-red-600"
                                                    placeholder="Mật khẩu đồng bộ"
                                                    value={formData.zalo_backup_password}
                                                    onChange={e => setFormData({ ...formData, zalo_backup_password: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Quyền Bot Center */}
                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-sm font-bold text-amber-900 block mb-1">
                                                    Trung tâm Bot Tự động (Bot Center)
                                                </label>
                                                <p className="text-xs text-amber-700/80">
                                                    Cấp quyền cho nhân sự sử dụng tính năng Marketing tự động
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.can_use_bot_center}
                                                    onChange={e => setFormData({ ...formData, can_use_bot_center: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

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
                    </div >
                )
            }

            {/* Quick Password Reset Modal */}
            {isResetPasswordOpen && resetPasswordUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
                            <div className="flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-amber-600" />
                                <h3 className="font-bold text-slate-800">Đặt lại mật khẩu</h3>
                            </div>
                            <button onClick={() => setIsResetPasswordOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-slate-500">Tài khoản</p>
                                <p className="text-sm font-bold text-slate-800">{resetPasswordUser.full_name || resetPasswordUser.email}</p>
                                <p className="text-xs text-slate-400">{resetPasswordUser.email}</p>
                            </div>
                            {resetPasswordUser.login_password && (
                                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                                    <p className="text-xs text-amber-600 font-medium">Mật khẩu hiện tại</p>
                                    <p className="text-sm font-mono font-bold text-amber-800 mt-0.5 select-all">{resetPasswordUser.login_password}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        type={showResetPassword ? "text" : "password"}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                        placeholder="Tối thiểu 6 ký tự..."
                                        value={resetPassword}
                                        onChange={e => setResetPassword(e.target.value)}
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Mật khẩu sẽ được áp dụng ngay lập tức</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setIsResetPasswordOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">Hủy</button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={isResettingPassword || resetPassword.length < 6}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isResettingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><KeyRound className="w-4 h-4" /> Đặt lại</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
