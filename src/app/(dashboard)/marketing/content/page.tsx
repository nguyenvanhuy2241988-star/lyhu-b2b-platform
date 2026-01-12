"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Calendar as CalendarIcon, List, FileText, MoreHorizontal, X, Edit2, Trash2, Filter, Megaphone } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchMarketingPosts, MarketingPost, createMarketingPost, deleteMarketingPost, updateMarketingPost, fetchCampaigns, MarketingCampaign } from "@/lib/marketingStore";
import { TableSkeleton } from "@/components/ui/SkeletonUI";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export default function ContentPage() {
    const { user, session } = useAuth();
    const [posts, setPosts] = useState<MarketingPost[]>([]);
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [platformFilter, setPlatformFilter] = useState("all");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<MarketingPost>>({
        title: "",
        content: "",
        platform: "facebook",
        status: "draft",
        scheduled_at: "",
        campaign_id: "",
        tracking_url: ""
    });

    const loadData = async () => {
        setIsLoading(true);
        const [postsData, campaignsData] = await Promise.all([
            fetchMarketingPosts(session?.access_token),
            fetchCampaigns(session?.access_token)
        ]);
        setPosts(postsData);
        setCampaigns(campaignsData);
        setIsLoading(false);
    };

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({ title: "", content: "", platform: "facebook", status: "draft", scheduled_at: "", campaign_id: "", tracking_url: "" });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (post: MarketingPost) => {
        setEditingId(post.id);
        setFormData({
            title: post.title,
            content: post.content || "",
            platform: post.platform,
            status: post.status,
            scheduled_at: post.scheduled_at ? format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm") : "",
            campaign_id: post.campaign_id || "",
            tracking_url: post.tracking_url || ""
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title) {
            toast.error("Vui lòng nhập tiêu đề bài viết");
            return;
        }
        setIsSubmitting(true);

        // Ensure scheduled_at is formatted correctly or null if empty
        const postData = { ...formData };
        if (!postData.scheduled_at) delete postData.scheduled_at;
        if (!postData.campaign_id) delete postData.campaign_id;

        let success = false;
        if (editingId) {
            success = await updateMarketingPost(editingId, postData, session?.access_token);
        } else {
            const res = await createMarketingPost(postData, session?.access_token);
            success = !!res;
        }

        setIsSubmitting(false);
        // Helper returns boolean for update, object for create
        // We'll just refresh
        toast.success(editingId ? "Đã cập nhật bài viết" : "Đã tạo bài viết");
        setIsDialogOpen(false);
        loadData();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Xóa bài viết này?")) {
            await deleteMarketingPost(id, session?.access_token);
            loadData();
            toast.success("Đã xóa");
        }
    };

    // Filter Logic
    const filteredPosts = posts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = platformFilter === 'all' || p.platform === platformFilter;
        return matchesSearch && matchesPlatform;
    });

    // --- CALENDAR RENDER LOGIC ---
    const renderCalendar = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });
        const startDayParams = getDay(start);
        const emptyDays = Array(startDayParams).fill(null);

        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Calendar Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-md bg-white border border-slate-200 shadow-sm p-1">
                            <button className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&lt;</button>
                            <span className="px-4 py-1.5 font-bold text-slate-700 min-w-[140px] text-center">
                                {format(currentMonth, 'MMMM yyyy', { locale: vi })}
                            </span>
                            <button className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</button>
                        </div>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'].map(d => (
                        <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
                    {emptyDays.map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white min-h-[120px]" />
                    ))}
                    {days.map(day => {
                        const dayPosts = filteredPosts.filter(p => p.scheduled_at && isSameDay(new Date(p.scheduled_at), day));
                        return (
                            <div key={day.toString()} className="bg-white min-h-[120px] p-2 hover:bg-slate-50 transition-colors">
                                <div className={`text-right text-xs font-medium mb-1 ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-1">
                                    {dayPosts.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleOpenEdit(p)}
                                            className={`text-[10px] px-1.5 py-1 rounded border truncate font-medium cursor-pointer ${p.platform === 'facebook' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                p.platform === 'tiktok' ? 'bg-slate-900 text-white border-slate-800' :
                                                    'bg-orange-50 text-orange-700 border-orange-100'
                                                }`}
                                        >
                                            {p.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-600" />
                        Quản lý Content
                    </h2>
                    <p className="text-sm text-slate-500">Lịch đăng bài và nội dung truyền thông</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Danh sách
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Lịch
                        </button>
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-white hover:bg-orange-700 h-10 px-4 py-2 gap-2"
                    >
                        <Plus className="w-4 h-4" /> Tạo bài viết
                    </button>

                    {/* Modal */}
                    {isDialogOpen && (
                        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center p-6 border-b">
                                    <h3 className="text-lg font-semibold">{editingId ? "Cập nhật bài viết" : "Soạn bài viết mới"}</h3>
                                    <button onClick={() => setIsDialogOpen(false)} className="text-slate-500 hover:text-slate-700">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Tiêu đề</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Tiêu đề bài viết..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Nền tảng</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                                value={formData.platform}
                                                onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                                            >
                                                <option value="facebook">Facebook</option>
                                                <option value="tiktok">TikTok</option>
                                                <option value="website">Website / Blog</option>
                                                <option value="zalo">Zalo OA</option>
                                                <option value="other">Khác</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium leading-none">Trạng thái</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            >
                                                <option value="draft">Bản nháp</option>
                                                <option value="scheduled">Đã lên lịch</option>
                                                <option value="published">Đã đăng</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Chiến dịch (Tùy chọn)</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                            value={formData.campaign_id || ""}
                                            onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                                        >
                                            <option value="">-- Không thuộc chiến dịch nào --</option>
                                            {campaigns.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Link bài viết (Tracking)</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                            value={formData.tracking_url || ''}
                                            onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
                                            placeholder="https://facebook.com/..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Ngày đăng (Tùy chọn)</label>
                                        <input
                                            type="datetime-local"
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                            value={formData.scheduled_at || ''}
                                            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Nội dung</label>
                                        <textarea
                                            className="flex min-h-[150px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                            placeholder="Nhập nội dung bài viết..."
                                            value={formData.content || ''}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-white hover:bg-orange-700 h-10 px-4 py-2"
                                    >
                                        {isSubmitting ? "Đang lưu..." : (editingId ? "Cập nhật" : "Lưu bài viết")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tìm kiếm bài viết..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                    >
                        <option value="all">Tất cả nền tảng</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="website">Website</option>
                        <option value="zalo">Zalo</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton rows={5} cols={5} />
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-medium">
                            <tr>
                                <th className="px-6 py-4">Tiêu đề</th>
                                <th className="px-6 py-4">Nền tảng</th>
                                <th className="px-6 py-4">Lịch đăng</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPosts.map((post) => (
                                <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{post.title}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{post.content}</div>
                                        {post.campaign && (
                                            <div className="inline-flex items-center text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 mt-1">
                                                <Megaphone className="w-3 h-3 mr-1" /> {post.campaign.title}
                                            </div>
                                        )}
                                        {post.tracking_url && (
                                            <a href={post.tracking_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center text-[10px] text-blue-600 hover:underline mt-1">
                                                Link bài viết
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${post.platform === 'facebook' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            post.platform === 'tiktok' ? 'bg-slate-800 text-slate-200 border-slate-700' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {post.platform}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {post.scheduled_at ? format(new Date(post.scheduled_at), 'dd/MM/yyyy HH:mm') : 'Chưa set'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.status === 'published' ? 'bg-green-100 text-green-800' :
                                            post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                            {post.status === 'published' ? 'Đã đăng' :
                                                post.status === 'scheduled' ? 'Đã lên lịch' : 'Bản nháp'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                                            onClick={() => handleOpenEdit(post)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                                            onClick={() => handleDelete(post.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Không tìm thấy bài viết nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                renderCalendar()
            )}
        </div>
    );
}
