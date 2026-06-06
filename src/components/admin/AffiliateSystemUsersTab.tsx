import { useState, useEffect } from "react";
import { UserPlus, Shield, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function AffiliateSystemUsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [upgradingId, setUpgradingId] = useState<string | null>(null);

    useEffect(() => {
        fetchSystemUsers();
    }, []);

    const fetchSystemUsers = async () => {
        setLoading(true);
        try {
            // Lấy tất cả profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone, role')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            // Lấy danh sách affiliate hiện có để loại trừ
            const { data: affiliates, error: affiliatesError } = await supabase
                .from('affiliate_profiles')
                .select('user_id');

            if (affiliatesError) throw affiliatesError;

            const affiliateUserIds = new Set(affiliates?.map(a => a.user_id));

            // Lọc ra những người chưa là affiliate
            const potentialUsers = profiles?.filter(p => !affiliateUserIds.has(p.id)) || [];
            
            setUsers(potentialUsers);
        } catch (error) {
            console.error("Lỗi khi tải danh sách người dùng", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradeToAffiliate = async (userId: string) => {
        setUpgradingId(userId);
        try {
            // Sinh mã ngẫu nhiên: LYHU_ + 5 ký tự ngẫu nhiên
            const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
            const autoCode = `LYHU_${randomString}`;

            const { error } = await supabase
                .from('affiliate_profiles')
                .insert({
                    user_id: userId,
                    affiliate_code: autoCode,
                    commission_rate: 10, // Mức cơ bản
                    status: 'active'
                });

            if (error) {
                if (error.code === '23505') {
                    alert("Người dùng này đã là Affiliate hoặc Mã Affiliate đã bị trùng, vui lòng thử lại.");
                } else {
                    alert("Lỗi cấp mã: " + error.message);
                }
                throw error;
            }

            alert(`Đã nâng cấp thành công! Mã Affiliate: ${autoCode}`);
            // Xóa người này khỏi danh sách
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Lỗi cấp mã:", error);
        } finally {
            setUpgradingId(null);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone?.includes(searchQuery))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text"
                        placeholder="Tìm tên, email hoặc SĐT..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-medium text-slate-500 text-sm">Người dùng</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Liên hệ</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Phân quyền</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">Đang tải danh sách...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">Không có người dùng nào phù hợp.</td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="font-medium text-slate-900">{user.full_name || 'Khách hàng vô danh'}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-slate-600">{user.email || '-'}</div>
                                        <div className="text-xs text-slate-500">{user.phone || '-'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => handleUpgradeToAffiliate(user.id)}
                                            disabled={upgradingId === user.id}
                                            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                        >
                                            <Shield size={16} /> 
                                            {upgradingId === user.id ? 'Đang cấp mã...' : 'Nâng cấp CTV'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
