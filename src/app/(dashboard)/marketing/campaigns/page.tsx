"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Megaphone, Calendar, Filter, X, Edit2, Trash2 } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchCampaigns, MarketingCampaign, createCampaign, deleteCampaign, updateCampaign, getFbAdsConfig, updateFbAdsConfig, fetchFbAdsCampaigns, fetchFacebookPages, FacebookPage } from "@/lib/marketingStore";
import { autoSetupFacebookAds, fetchAllCampaignsInsights } from "@/lib/facebookAdsManager";
import { TableSkeleton } from "@/components/ui/SkeletonUI";
import { CampaignReportModal } from "@/components/marketing/CampaignReportModal";
import { toast } from "sonner";
import { Facebook, Rocket, BarChart3, Bot, Sparkles } from "lucide-react";
import OptimizationDashboard from "@/components/marketing/OptimizationDashboard";
import AutoCampaignGenerator from "@/components/marketing/AutoCampaignGenerator";

export default function CampaignsPage() {
    const { user, session } = useAuth();
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [fbCampaigns, setFbCampaigns] = useState<any[]>([]);
    const [fbInsights, setFbInsights] = useState<any[]>([]);
    const [fbPages, setFbPages] = useState<FacebookPage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Facebook Auto Setup State
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [isSettingUpFb, setIsSettingUpFb] = useState(false);
    const [fbSetupData, setFbSetupData] = useState({
        campaignName: "",
        objective: "OUTCOME_ENGAGEMENT" as "OUTCOME_TRAFFIC" | "OUTCOME_ENGAGEMENT",
        dailyBudget: 50000,
        pageId: "",
        message: "",
    });
    const [fbImageFile, setFbImageFile] = useState<File | null>(null);
    const [reportCampaign, setReportCampaign] = useState<{ id: string, name: string } | null>(null);
    
    // Facebook Integration State
    const [isFbModalOpen, setIsFbModalOpen] = useState(false);
    const [fbConfigId, setFbConfigId] = useState<string | null>(null);
    const [fbConfig, setFbConfig] = useState({ accessToken: "", adAccountId: "" });
    const [isSyncingFb, setIsSyncingFb] = useState(false);
    
    // AI Modals
    const [isOptimizeOpen, setIsOptimizeOpen] = useState(false);
    const [isAutoCampOpen, setIsAutoCampOpen] = useState(false);

    // Search & Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [objectiveFilter, setObjectiveFilter] = useState("all");

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
        
        // Load FB Ads Config & Campaigns
        const fbData = await getFbAdsConfig(session?.access_token);
        if (fbData) {
            setFbConfigId(fbData.id);
            if (fbData.facebook_ads_config?.accessToken) {
                setFbConfig(fbData.facebook_ads_config);
                try {
                    const [fbCamps, insights] = await Promise.all([
                        fetchFbAdsCampaigns(fbData.facebook_ads_config.accessToken, fbData.facebook_ads_config.adAccountId),
                        fetchAllCampaignsInsights(fbData.facebook_ads_config.accessToken, fbData.facebook_ads_config.adAccountId)
                    ]);
                    setFbCampaigns(fbCamps);
                    setFbInsights(insights);
                } catch (e: any) {
                    toast.error("Lỗi đồng bộ FB Ads: " + e.message);
                }
            }
        }
        
        // Fetch FB Pages for Auto Setup
        const pages = await fetchFacebookPages(session?.access_token);
        setFbPages(pages);
        if (pages.length > 0 && !fbSetupData.pageId) {
            setFbSetupData(prev => ({ ...prev, pageId: pages[0].page_id }));
        }

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

    const handleSaveFbConfig = async () => {
        if (!fbConfigId) {
            toast.error("Chưa có ID cấu hình");
            return;
        }
        setIsSyncingFb(true);
        const success = await updateFbAdsConfig(fbConfigId, fbConfig, session?.access_token);
        if (success) {
            toast.success("Đã lưu cấu hình Facebook Ads");
            setIsFbModalOpen(false);
            loadCampaigns();
        } else {
            toast.error("Lỗi lưu cấu hình");
        }
        setIsSyncingFb(false);
    };

    const handleAutoSetupFbAds = async () => {
        if (!fbConfig.accessToken || !fbConfig.adAccountId) {
            toast.error("Vui lòng Kết nối FB Ads trước!");
            return;
        }
        if (!fbSetupData.campaignName || !fbSetupData.pageId || !fbSetupData.message || !fbImageFile) {
            toast.error("Vui lòng điền đầy đủ thông tin và tải ảnh lên!");
            return;
        }
        setIsSettingUpFb(true);
        try {
            toast.info("Đang tự động thiết lập chiến dịch trên Facebook...");
            await autoSetupFacebookAds({
                accessToken: fbConfig.accessToken,
                adAccountId: fbConfig.adAccountId,
                campaignName: fbSetupData.campaignName,
                objective: fbSetupData.objective,
                dailyBudget: fbSetupData.dailyBudget,
                pageId: fbSetupData.pageId,
                message: fbSetupData.message,
                imageFile: fbImageFile
            });
            toast.success("Thiết lập thành công! Quá trình mất 1 phút để đồng bộ.");
            setIsSetupModalOpen(false);
            setFbSetupData({ ...fbSetupData, campaignName: "", message: "" });
            setFbImageFile(null);
            loadCampaigns();
        } catch (e: any) {
            toast.error(e.message);
        }
        setIsSettingUpFb(false);
    };

    // Filter Logic
    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredFbCampaigns = fbCampaigns.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            if (statusFilter === 'active') matchesStatus = c.status === 'ACTIVE';
            else if (statusFilter === 'paused') matchesStatus = c.status === 'PAUSED';
            else matchesStatus = false;
        }

        let matchesObjective = true;
        if (objectiveFilter !== 'all') {
            matchesObjective = c.objective === objectiveFilter;
        }

        return matchesSearch && matchesStatus && matchesObjective;
    });

    const formatObjective = (obj: string) => {
        const map: any = {
            'OUTCOME_TRAFFIC': 'Lưu lượng truy cập',
            'OUTCOME_ENGAGEMENT': 'Tương tác (Tin nhắn, Video, Post)',
            'OUTCOME_SALES': 'Doanh số',
            'OUTCOME_LEADS': 'Khách hàng tiềm năng',
            'OUTCOME_AWARENESS': 'Nhận biết thương hiệu'
        };
        return map[obj] || obj || 'Chưa rõ';
    };

    const getScoreBadge = (score: number) => {
        if (score >= 8) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">🟢 {score.toFixed(1)}/10</span>;
        if (score >= 5) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">🟡 {score.toFixed(1)}/10</span>;
        if (score > 0) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">🔴 {score.toFixed(1)}/10</span>;
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">Chưa cắn tiền</span>;
    };

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

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsFbModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 h-10 px-4 py-2 gap-2"
                    >
                        <Facebook className="w-4 h-4" /> Kết nối FB
                    </button>
                    <button 
                        onClick={() => setIsAutoCampOpen(true)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 h-10 px-4 py-2 gap-2 shadow-sm transition-all"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI Lên Camp
                    </button>
                    <button 
                        onClick={() => setIsOptimizeOpen(true)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 h-10 px-4 py-2 gap-2 shadow-sm transition-all hover:shadow-md"
                    >
                        <Bot className="w-4 h-4" />
                        AI Tối ưu
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-slate-800 text-white hover:bg-slate-900 h-10 px-4 py-2 gap-2"
                    >
                        <Plus className="w-4 h-4" /> Tạo chiến dịch
                    </button>
                </div>
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
                        value={objectiveFilter}
                        onChange={(e) => setObjectiveFilter(e.target.value)}
                    >
                        <option value="all">Tất cả mục tiêu FB</option>
                        <option value="OUTCOME_ENGAGEMENT">Tương tác (Tin nhắn, Video...)</option>
                        <option value="OUTCOME_TRAFFIC">Lưu lượng truy cập</option>
                        <option value="OUTCOME_SALES">Doanh số</option>
                    </select>
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
                            {/* Render FB Campaigns */}
                            {filteredFbCampaigns.map((fbCamp) => {
                                const insight = fbInsights.find(i => i.campaign_id === fbCamp.id);
                                const ctr = Number(insight?.ctr || 0);
                                const spend = Number(insight?.spend || 0);
                                let score = 0;
                                if (spend > 0) {
                                    score = 5; // Base score
                                    if (ctr > 2) score += 2;
                                    else if (ctr > 1) score += 1;
                                    else score -= 2;
                                    
                                    const cprObj = insight?.cost_per_action_type?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
                                    const cpr = cprObj?.value ? Number(cprObj.value) : 0;
                                    if (cpr > 0 && cpr < 30000) score += 3;
                                    else if (cpr > 0 && cpr > 100000) score -= 3;
                                    
                                    score = Math.max(1, Math.min(10, score)); // clamp 1-10
                                }

                                return (
                                <tr key={`fb-${fbCamp.id}`} className="hover:bg-blue-50/50 transition-colors bg-blue-50/10">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <Facebook className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>{fbCamp.name}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                            <span>Mục tiêu: <strong className="text-slate-700">{formatObjective(fbCamp.objective)}</strong></span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            fbCamp.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                                            fbCamp.status === 'PAUSED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {fbCamp.status}
                                        </span>
                                        <div className="mt-2">
                                            {getScoreBadge(score)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">Facebook Ads</td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                                        {fbCamp.daily_budget ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fbCamp.daily_budget) + '/ngày' :
                                         fbCamp.lifetime_budget ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fbCamp.lifetime_budget) + ' (Tổng)' : 
                                         <span className="text-xs text-slate-500 font-normal border border-slate-200 rounded px-2 py-0.5 bg-slate-50">CBO Off (Cấp Nhóm)</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => setReportCampaign({ id: fbCamp.id, name: fbCamp.name })}
                                                className="text-indigo-600 hover:text-indigo-900 transition-colors flex items-center gap-1"
                                                title="Báo cáo & Phân tích"
                                            >
                                                <BarChart3 className="w-4 h-4" /> Báo cáo
                                            </button>
                                            <span className="text-xs text-blue-600 font-medium">Synced</span>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                            {filteredCampaigns.length === 0 && filteredFbCampaigns.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        {searchTerm || statusFilter !== 'all' ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có chiến dịch nào'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
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
            {/* MODAL KẾT NỐI FACEBOOK ADS */}
            {isFbModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Facebook className="w-5 h-5 text-blue-600" />
                                Cấu hình Facebook Ads
                            </h3>
                            <button onClick={() => setIsFbModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Access Token (Dùng nội bộ)</label>
                                <input
                                    type="text"
                                    value={fbConfig.accessToken}
                                    onChange={(e) => setFbConfig({ ...fbConfig, accessToken: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="EAAG..."
                                />
                                <p className="text-xs text-slate-500">Lấy System User Token từ Facebook Business Manager.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ad Account ID</label>
                                <input
                                    type="text"
                                    value={fbConfig.adAccountId}
                                    onChange={(e) => setFbConfig({ ...fbConfig, adAccountId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="act_..."
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-2">
                            <button
                                onClick={() => setIsFbModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveFbConfig}
                                disabled={isSyncingFb}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSyncingFb ? "Đang đồng bộ..." : "Lưu & Đồng bộ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL AUTO SETUP FB ADS */}
            {isSetupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden my-8">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Rocket className="w-5 h-5 text-indigo-600" />
                                Tự động Thiết lập Quảng cáo FB
                            </h3>
                            <button onClick={() => setIsSetupModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Tên chiến dịch</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-600 outline-none"
                                        placeholder="VD: Khuyến mãi Tháng 6"
                                        value={fbSetupData.campaignName}
                                        onChange={(e) => setFbSetupData({ ...fbSetupData, campaignName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Fanpage đăng tải</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={fbSetupData.pageId}
                                        onChange={(e) => setFbSetupData({ ...fbSetupData, pageId: e.target.value })}
                                    >
                                        <option value="">-- Chọn Fanpage --</option>
                                        {fbPages.map(page => (
                                            <option key={page.id} value={page.page_id}>{page.page_id} (Đã kết nối)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Mục tiêu chiến dịch</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={fbSetupData.objective}
                                        onChange={(e) => setFbSetupData({ ...fbSetupData, objective: e.target.value as any })}
                                    >
                                        <option value="OUTCOME_ENGAGEMENT">Lượt tương tác (Nhắn tin)</option>
                                        <option value="OUTCOME_TRAFFIC">Lưu lượng truy cập (Web)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Ngân sách hàng ngày (VNĐ)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-600 outline-none"
                                        value={fbSetupData.dailyBudget}
                                        onChange={(e) => setFbSetupData({ ...fbSetupData, dailyBudget: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Nội dung bài viết (Text)</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-600 outline-none h-24 resize-none"
                                    placeholder="Viết nội dung quảng cáo siêu cuốn hút tại đây..."
                                    value={fbSetupData.message}
                                    onChange={(e) => setFbSetupData({ ...fbSetupData, message: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Hình ảnh quảng cáo</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="fb-ad-image-upload"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFbImageFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <label htmlFor="fb-ad-image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">
                                            {fbImageFile ? fbImageFile.name : "Tải lên hoặc kéo thả ảnh (từ AI Poster Studio)"}
                                        </span>
                                        <span className="text-xs text-slate-500 mt-1">PNG, JPG tối đa 5MB</span>
                                    </label>
                                </div>
                            </div>

                        </div>
                        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-2">
                            <button
                                onClick={() => setIsSetupModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAutoSetupFbAds}
                                disabled={isSettingUpFb}
                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-md disabled:opacity-50 flex items-center gap-2 shadow-sm"
                            >
                                {isSettingUpFb ? "Đang xử lý ngầm (5 bước)..." : "Khởi chạy Quảng Cáo"}
                                <Rocket className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL BÁO CÁO CHIẾN DỊCH FB */}
            {reportCampaign && fbConfig.accessToken && (
                <CampaignReportModal 
                    campaignId={reportCampaign.id}
                    campaignName={reportCampaign.name}
                    accessToken={fbConfig.accessToken}
                    onClose={() => setReportCampaign(null)}
                />
            )}

            <OptimizationDashboard 
                isOpen={isOptimizeOpen}
                onClose={() => setIsOptimizeOpen(false)}
                accessToken={fbConfig.accessToken}
                adAccountId={fbConfig.adAccountId}
            />

            <AutoCampaignGenerator
                isOpen={isAutoCampOpen}
                onClose={() => setIsAutoCampOpen(false)}
                onSuccess={() => loadCampaigns()}
            />
        </div>
    );
}
