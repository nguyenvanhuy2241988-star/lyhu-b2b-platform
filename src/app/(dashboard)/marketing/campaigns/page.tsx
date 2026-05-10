"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Megaphone, Calendar, Filter, X, Edit2, Trash2 } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchCampaigns, MarketingCampaign, createCampaign, deleteCampaign, updateCampaign } from "@/lib/marketingStore";
import { TableSkeleton } from "@/components/ui/SkeletonUI";
import { toast } from "sonner";

export default function CampaignsPage() {
    const { user, session } = useAuth();
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<MarketingCampaign>>({
        title: "",
        status: "planning",
        channel: "",
        budget: 0
    });

    const loadCampaigns = async () => {
        setIsLoading(true);
        const data = await fetchCampaigns(session?.access_token);
        setCampaigns(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (user) loadCampaigns();
    }, [user]);

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({ title: "", status: "planning", channel: "", budget: 0 });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (campaign: MarketingCampaign) => {
        setEditingId(campaign.id);
        setFormData({
            title: campaign.title,
            status: campaign.status,
            channel: campaign.channel || "",
            budget: campaign.budget || 0
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title) {
            toast.error("Vui lòng nhập tên chiến dịch");
            return;
        }
        setIsSubmitting(true);

        let success = false;
        if (editingId) {
            success = await updateCampaign(editingId, formData, session?.access_token);
        } else {
            const res = await createCampaign(formData, session?.access_token);
            success = !!res;
        }

        setIsSubmitting(false);
        if (success || !editingId) { // createCampaign helper might return null even on success if no return body
            toast.success(editingId ? "Đã cập nhật chiến dịch" : "Đã tạo chiến dịch");
            setIsDialogOpen(false);
            loadCampaigns();
        } else {
            toast.error("Có lỗi xảy ra");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa chiến dịch này?")) {
            const success = await deleteCampaign(id, session?.access_token);
            if (success) {
                toast.success("Đã xóa chiến dịch");
                loadCampaigns();
            } else {
                toast.error("Lỗi khi xóa chiến dịch");
            }
        }
    };

    // Filter Logic
    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-blue-600" />
                        Quản lý Chiến dịch
                    </h2>
                    <p className="text-sm text-slate-500">Lên kế hoạch và theo dõi hiệu quả các chiến dịch Marketing</p>
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 gap-2"
                >
                    <Plus className="w-4 h-4" /> Tạo chiến dịch
                </button>
            </div>

            {/* Modal */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold">{editingId ? "Cập nhật chiến dịch" : "Tạo chiến dịch mới"}</h3>
                            <button onClick={() => setIsDialogOpen(false)} className="text-slate-500 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Tên chiến dịch</label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="VD: Khuyến mãi Tết 2026..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Trạng thái</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    >
                                        <option value="planning">Lên kế hoạch</option>
                                        <option value="active">Đang chạy</option>
                                        <option value="paused">Tạm dừng</option>
                                        <option value="completed">Đã kết thúc</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Kênh triển khai</label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                        value={formData.channel || ''}
                                        onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                                        placeholder="Facebook, TikTok..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Ngân sách dự kiến (VNĐ)</label>
                                <input
                                    type="number"
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-2">
                            <button
                                onClick={() => setIsDialogOpen(false)}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                            >
                                {isSubmitting ? "Đang xử lý..." : (editingId ? "Cập nhật" : "Tạo mới")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tìm kiếm chiến dịch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="planning">Lên kế hoạch</option>
                        <option value="active">Đang chạy</option>
                        <option value="paused">Tạm dừng</option>
                        <option value="completed">Đã kết thúc</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton rows={5} cols={5} />
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-medium">
                            <tr>
                                <th className="px-6 py-4">Tên chiến dịch</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4">Kênh</th>
                                <th className="px-6 py-4 text-right">Ngân sách</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCampaigns.map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <Link
                                            href={`/marketing/leads?campaign_id=${campaign.id}&campaign_name=${encodeURIComponent(campaign.title)}`}
                                            className="hover:text-blue-600 hover:underline block"
                                            title="Xem danh sách khách hàng"
                                        >
                                            {campaign.title}
                                        </Link>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('vi-VN') : 'Chưa set ngày'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${campaign.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                            campaign.status === 'planning' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                campaign.status === 'paused' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {campaign.status === 'active' ? 'Đang chạy' :
                                                campaign.status === 'planning' ? 'Lên kế hoạch' :
                                                    campaign.status === 'paused' ? 'Tạm dừng' : 'Đã xong'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{campaign.channel || '-'}</td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(campaign.budget || 0)}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                                            onClick={() => handleOpenEdit(campaign)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                                            onClick={() => handleDelete(campaign.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCampaigns.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        {searchTerm || statusFilter !== 'all' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có chiến dịch nào'}
                                    </td>
                                </tr>
                            )}
                        </table>
                    </div>
                    
                    {/* Mobile Card List View */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {filteredCampaigns.map((campaign) => (
                            <div key={campaign.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 pr-2">
                                        <Link
                                            href={`/marketing/leads?campaign_id=${campaign.id}&campaign_name=${encodeURIComponent(campaign.title)}`}
                                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline block line-clamp-2"
                                        >
                                            {campaign.title}
                                        </Link>
                                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('vi-VN') : 'Chưa set ngày'}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 border ${campaign.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                        campaign.status === 'planning' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            campaign.status === 'paused' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                        {campaign.status === 'active' ? 'Đang chạy' :
                                            campaign.status === 'planning' ? 'Lên kế hoạch' :
                                                campaign.status === 'paused' ? 'Tạm dừng' : 'Đã xong'}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-3 bg-slate-50 p-3 rounded-lg">
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Kênh</div>
                                        <div className="font-medium text-slate-900 text-sm truncate">{campaign.channel || '-'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Ngân sách</div>
                                        <div className="font-bold text-slate-900 text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(campaign.budget || 0)}</div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        className="inline-flex items-center justify-center rounded-lg p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                                        onClick={() => handleOpenEdit(campaign)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="inline-flex items-center justify-center rounded-lg p-2 bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                        onClick={() => handleDelete(campaign.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredCampaigns.length === 0 && (
                            <div className="p-8 text-center text-slate-500 italic">
                                {searchTerm || statusFilter !== 'all' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có chiến dịch nào'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
