"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Copy, Plus, Trash, CheckCircle, XCircle, Users, Settings, Package, UserPlus } from "lucide-react";
import { AffiliateProductsTab } from "@/components/admin/AffiliateProductsTab";
import { AffiliateSystemUsersTab } from "@/components/admin/AffiliateSystemUsersTab";

export default function AdminAffiliatesPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'partners' | 'rules' | 'users'>('partners');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newIdentifier, setNewIdentifier] = useState("");
    const [newCode, setNewCode] = useState("");
    const [newRate, setNewRate] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (activeTab === 'partners') {
            fetchProfiles();
        }
    }, [activeTab]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('affiliate_profiles')
                .select(`
                    id, affiliate_code, commission_rate, status, created_at,
                    profiles:user_id ( full_name, email, phone )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error("Error fetching affiliates", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('affiliate_profiles')
                .update({ status })
                .eq('id', id);
            
            if (error) throw error;
            fetchProfiles();
        } catch (error) {
            alert("Lỗi cập nhật trạng thái");
        }
    };

    const handleAddAffiliate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // 1. Tìm user theo email hoặc SĐT
            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .or(`email.eq.${newIdentifier},phone.eq.${newIdentifier}`)
                .limit(1);

            const userProfile = users?.[0];

            if (userError || !userProfile) {
                alert("Không tìm thấy người dùng với Email hoặc Số điện thoại này trong hệ thống.");
                setIsSubmitting(false);
                return;
            }

            // 2. Tạo affiliate profile
            const { error: insertError } = await supabase
                .from('affiliate_profiles')
                .insert({
                    user_id: userProfile.id,
                    affiliate_code: newCode,
                    commission_rate: newRate,
                    status: 'active'
                });

            if (insertError) {
                if (insertError.code === '23505') { // Unique violation
                    alert("Người dùng này đã là Affiliate hoặc Mã Affiliate đã bị trùng.");
                } else {
                    alert("Lỗi thêm đối tác: " + insertError.message);
                }
                setIsSubmitting(false);
                return;
            }

            alert("Đã thêm đối tác thành công!");
            setIsModalOpen(false);
            setNewIdentifier("");
            setNewCode("");
            setNewRate(10);
            fetchProfiles();
        } catch (error) {
            alert("Đã xảy ra lỗi không xác định.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold">Quản lý Affiliate</h1>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('partners')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'partners' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <Users size={18} /> Đối tác CTV/KOL
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <UserPlus size={18} /> Người dùng hệ thống
                    </button>
                    <button 
                        onClick={() => setActiveTab('rules')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'rules' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <Package size={18} /> Cấu hình Hoa hồng Sản phẩm
                    </button>
                </div>
            </div>

            {activeTab === 'rules' ? (
                <AffiliateProductsTab />
            ) : activeTab === 'users' ? (
                <AffiliateSystemUsersTab />
            ) : (
                <>
                    <div className="flex justify-end mb-4">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                            <Plus size={20} /> Thêm Đối Tác
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-medium text-slate-500">Đối tác</th>
                                <th className="p-4 font-medium text-slate-500">Mã Affiliate</th>
                                <th className="p-4 font-medium text-slate-500">Hoa hồng (%)</th>
                                <th className="p-4 font-medium text-slate-500">Trạng thái</th>
                                <th className="p-4 font-medium text-slate-500">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Đang tải...</td>
                                </tr>
                            ) : profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có đối tác Affiliate nào.</td>
                                </tr>
                            ) : profiles.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-medium">{p.profiles?.full_name || 'No Name'}</div>
                                        <div className="text-sm text-slate-500">{p.profiles?.email}</div>
                                        <div className="text-sm text-slate-500">{p.profiles?.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-mono text-sm border border-blue-100 flex items-center w-max gap-2">
                                            {p.affiliate_code}
                                            <button onClick={() => navigator.clipboard.writeText(p.affiliate_code)} className="hover:text-blue-900">
                                                <Copy size={14} />
                                            </button>
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-green-600">{p.commission_rate}%</td>
                                    <td className="p-4">
                                        {p.status === 'active' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Đang hoạt động</span>}
                                        {p.status === 'pending' && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">Chờ duyệt</span>}
                                        {p.status === 'suspended' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Bị khóa</span>}
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        {p.status !== 'active' && (
                                            <button onClick={() => updateStatus(p.id, 'active')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Duyệt / Kích hoạt">
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        {p.status !== 'suspended' && (
                                            <button onClick={() => updateStatus(p.id, 'suspended')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Khóa tài khoản">
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Thêm Đối Tác */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Thêm Đối Tác Affiliate</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddAffiliate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email hoặc Số điện thoại</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ví dụ: nguyenvanhuy@gmail.com hoặc 0987654321"
                                    value={newIdentifier}
                                    onChange={e => setNewIdentifier(e.target.value.trim())}
                                />
                                <p className="text-xs text-slate-500 mt-1">Người dùng phải có tài khoản trên LYHU trước.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mã Affiliate (Tự chọn)</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ví dụ: HUY_KOL_99"
                                    value={newCode}
                                    onChange={e => setNewCode(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tỷ lệ hoa hồng (%)</label>
                                <input 
                                    type="number" 
                                    required 
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                                    value={newRate}
                                    onChange={e => setNewRate(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                    {isSubmitting ? "Đang xử lý..." : "Xác nhận thêm"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
                </>
            )}
        </div>
    );
}
