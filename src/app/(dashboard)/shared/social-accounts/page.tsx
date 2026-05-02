"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Search, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

interface SocialAccount {
    id: string;
    platform: string;
    account_name: string;
    login_id: string;
    password?: string;
    backup_password?: string;
    recovery_info?: string;
    assigned_to?: string;
    status: string;
    notes?: string;
}

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

const PLATFORMS = ["Zalo", "Facebook", "TikTok", "Instagram", "Threads", "Google", "Email", "Khác"];
const STATUSES = {
    active: "Đang hoạt động",
    restricted: "Bị hạn chế",
    banned: "Bị khóa",
    inactive: "Chưa sử dụng"
};

export default function SocialAccountsPage() {
    const { session, role } = useAuth();
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPlatform, setFilterPlatform] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});

    // Form state
    const [formData, setFormData] = useState<Partial<SocialAccount>>({
        platform: "Zalo",
        account_name: "",
        login_id: "",
        password: "",
        backup_password: "",
        recovery_info: "",
        assigned_to: "",
        status: "active",
        notes: ""
    });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [accountsRes, profilesRes] = await Promise.all([
                supabase.from('company_social_accounts').select('*').order('created_at', { ascending: false }),
                supabase.from('profiles').select('id, full_name, email')
            ]);

            if (accountsRes.error) throw accountsRes.error;
            if (profilesRes.error) throw profilesRes.error;

            setAccounts(accountsRes.data || []);
            setProfiles(profilesRes.data || []);
        } catch (error: any) {
            toast.error("Lỗi khi tải dữ liệu: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const togglePassword = (id: string) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleOpenCreate = () => {
        setEditingAccount(null);
        setFormData({
            platform: "Zalo",
            account_name: "",
            login_id: "",
            password: "",
            backup_password: "",
            recovery_info: "",
            assigned_to: "",
            status: "active",
            notes: ""
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (account: SocialAccount) => {
        setEditingAccount(account);
        setFormData({ ...account, assigned_to: account.assigned_to || "" });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const payload = {
                ...formData,
                assigned_to: formData.assigned_to === "" ? null : formData.assigned_to,
                updated_at: new Date().toISOString()
            };

            if (editingAccount) {
                const { error } = await supabase
                    .from('company_social_accounts')
                    .update(payload)
                    .eq('id', editingAccount.id);
                if (error) throw error;
                toast.success("Cập nhật thành công!");
            } else {
                const { error } = await supabase
                    .from('company_social_accounts')
                    .insert(payload);
                if (error) throw error;
                toast.success("Thêm mới thành công!");
            }

            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa tài khoản này? Hành động này không thể hoàn tác.")) return;

        const toastId = toast.loading("Đang xóa...");
        try {
            const { error } = await supabase.from('company_social_accounts').delete().eq('id', id);
            if (error) throw error;
            toast.success("Đã xóa tài khoản", { id: toastId });
            fetchData();
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = acc.account_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              acc.login_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = filterPlatform ? acc.platform === filterPlatform : true;
        return matchesSearch && matchesPlatform;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tài khoản Công ty</h1>
                    <p className="text-slate-500 mt-1">Quản lý tập trung toàn bộ tài khoản mạng xã hội, email của công ty</p>
                </div>
                {role === 'admin' && (
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm tài khoản
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hiển thị, ID đăng nhập..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[200px]"
                        value={filterPlatform}
                        onChange={e => setFilterPlatform(e.target.value)}
                    >
                        <option value="">Tất cả Nền tảng</option>
                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Nền tảng</th>
                                <th className="px-6 py-3 font-medium">Tên hiển thị</th>
                                <th className="px-6 py-3 font-medium">ID Đăng nhập</th>
                                <th className="px-6 py-3 font-medium">Mật khẩu</th>
                                <th className="px-6 py-3 font-medium">Khôi phục</th>
                                {role === 'admin' && <th className="px-6 py-3 font-medium">Giao cho</th>}
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                {role === 'admin' && <th className="px-6 py-3 font-medium text-right">Hành động</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                                        Không tìm thấy tài khoản nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((account) => {
                                    const assignee = profiles.find(p => p.id === account.assigned_to);
                                    const isPassVisible = showPassword[account.id];

                                    return (
                                        <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-xs">
                                                    <Globe className="w-3.5 h-3.5" />
                                                    {account.platform}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {account.account_name}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {account.login_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs w-20 truncate">
                                                        {account.password ? (isPassVisible ? account.password : '••••••••') : '-'}
                                                    </span>
                                                    {account.password && (
                                                        <button onClick={() => togglePassword(account.id)} className="text-slate-400 hover:text-slate-600">
                                                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {account.recovery_info || '-'}
                                            </td>
                                            {role === 'admin' && (
                                                <td className="px-6 py-4">
                                                    {assignee ? (
                                                        <span className="text-blue-600 font-medium">{assignee.full_name || assignee.email}</span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Chưa giao</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    account.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                    account.status === 'banned' ? 'bg-red-100 text-red-700' :
                                                    account.status === 'restricted' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {STATUSES[account.status as keyof typeof STATUSES]}
                                                </span>
                                            </td>
                                            {role === 'admin' && (
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(account)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(account.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingAccount ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nền tảng</label>
                                    <select
                                        required
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={formData.platform}
                                        onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                    >
                                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên hiển thị (Tên Kênh/Page)</label>
                                    <input
                                        required
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="vd: LYHU Official"
                                        value={formData.account_name}
                                        onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ID Đăng nhập (SĐT, Email, Username)</label>
                                <input
                                    required
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    placeholder="vd: 0987654321"
                                    value={formData.login_id}
                                    onChange={e => setFormData({ ...formData, login_id: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                        placeholder="Mật khẩu đăng nhập"
                                        value={formData.password || ""}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu sao lưu (Mã 2FA...)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                        placeholder="Khóa dự phòng, mã 2FA"
                                        value={formData.backup_password || ""}
                                        onChange={e => setFormData({ ...formData, backup_password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SĐT/Email Khôi phục</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Email hoặc SĐT khi mất pass"
                                        value={formData.recovery_info || ""}
                                        onChange={e => setFormData({ ...formData, recovery_info: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        {Object.entries(STATUSES).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Giao cho nhân viên sử dụng</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={formData.assigned_to || ""}
                                    onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                                >
                                    <option value="">-- Chưa giao cho ai --</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] text-sm"
                                    placeholder="Ghi chú thêm về tài khoản này..."
                                    value={formData.notes || ""}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isSaving ? "Đang lưu..." : "Lưu tài khoản"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
