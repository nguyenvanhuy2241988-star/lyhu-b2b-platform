"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Pencil, Trash2, X, Loader2, Check, BarChart3, Smartphone, Monitor, User as UserIcon, Clock, Activity, FileText, CheckCircle } from "lucide-react";
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
    created_at: string;
    // Activity Stats
    online_seconds: number;
    last_seen: string | null;
    is_online: boolean;
    last_path: string | null;
    device_info: string | null;
}

type TimeRange = '7d' | '30d' | '1y' | '3y' | '5y';
type ModalTab = 'overview' | 'activity_log';

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
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState<ModalTab>('overview');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    // Chart State
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');

    // Activity Logs State
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);



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
            const { data, error } = await supabase
                .from('crm_activities')
                .select('*, deal:crm_deals(title)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

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
    }, [debouncedSearchTerm]);

    // Fetch history when dragging range
    useEffect(() => {
        if (viewingUser && isDetailOpen) {
            if (currentTab === 'overview') {
                fetchUserHistory(viewingUser.id, timeRange);
            } else if (currentTab === 'activity_log') {
                fetchActivityLogs(viewingUser.id);
            }
        }
    }, [timeRange, viewingUser, isDetailOpen, currentTab]);

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
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
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
                                            <div className="font-medium text-slate-900">{user.email}</div>
                                            <div className="text-xs text-slate-500">{user.full_name || "Chưa đặt tên"}</div>
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

            {/* Detail Modal */}
            {isDetailOpen && viewingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 h-[90vh] flex flex-col">
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
                                className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${currentTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                Tổng quan & Hoạt động
                            </button>
                            <button
                                onClick={() => setCurrentTab('activity_log')}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${currentTab === 'activity_log' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <Activity className="w-4 h-4" />
                                Nhật ký công việc
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
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-blue-600" />
                                            Timeline hoạt động (50 gần nhất)
                                        </h4>
                                        <button onClick={() => viewingUser && fetchActivityLogs(viewingUser.id)} className="text-sm text-blue-600 hover:underline">
                                            Làm mới
                                        </button>
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
