"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FacebookPage, fetchFacebookPages, saveFacebookPage, fetchMarketingPosts, createMarketingPost, MarketingPost, MarketingCampaign, fetchCampaigns } from "@/lib/marketingStore";
import { Loader2, Plus, Facebook, Check, Trash2, Globe, Settings, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function MarketingContentPage() {
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [posts, setPosts] = useState<MarketingPost[]>([]);
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);

    // Create Post State
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPost, setNewPost] = useState<Partial<MarketingPost>>({
        title: '',
        content: '',
        platform: 'facebook',
        status: 'draft',
        facebook_page_id: '',
        media_urls: [],
        campaign_id: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock Connect Modal State
    const [isConnectOpen, setIsConnectOpen] = useState(false);
    const [connectForm, setConnectForm] = useState({
        page_id: '',
        name: '',
        access_token: 'mock_token_' + Math.floor(Math.random() * 10000),
        avatar_url: 'https://placehold.co/100x100?text=Page'
    });

    // Load initial data
    const loadData = async () => {
        setIsLoading(true);
        const [pagesData, postsData, campaignData] = await Promise.all([
            fetchFacebookPages(session?.access_token),
            fetchMarketingPosts(session?.access_token),
            fetchCampaigns(session?.access_token)
        ]);
        setPages(pagesData);
        setPosts(postsData);
        setCampaigns(campaignData);
        setIsLoading(false);
    };

    useEffect(() => {
        if (session?.access_token) loadData();
    }, [session]);

    const handleConnectMock = async () => {
        if (!connectForm.page_id || !connectForm.name) {
            toast.error("Vui lòng nhập ID và Tên Fanpage");
            return;
        }

        const res = await saveFacebookPage({
            ...connectForm,
            is_connected: true,
            category: 'Business',
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(connectForm.name)}&background=1877F2&color=fff`
        }, session?.access_token);

        if (res) {
            toast.success("Kết nối Fanpage thành công!");
            setIsConnectOpen(false);
            setConnectForm({ page_id: '', name: '', access_token: '', avatar_url: '' });
            loadData();
        } else {
            toast.error("Lỗi kết nối");
        }
    };

    const handleCreatePost = async () => {
        if (!newPost.title || !newPost.content) {
            toast.error("Vui lòng nhập tiêu đề và nội dung");
            return;
        }
        if (newPost.platform === 'facebook' && !newPost.facebook_page_id) {
            toast.error("Vui lòng chọn Fanpage đăng bài");
            return;
        }

        setIsSubmitting(true);
        // Mock image if needed
        const postToSave = {
            ...newPost,
            // If scheduled, status is scheduled
            status: newPost.scheduled_at ? 'scheduled' : (newPost.status || 'draft')
        };

        const created = await createMarketingPost(postToSave, session?.access_token);
        setIsSubmitting(false);

        if (created) {
            toast.success(postToSave.status === 'scheduled' ? "Đã lên lịch bài đăng!" : "Đã tạo bài viết!");
            setShowCreatePost(false);
            setNewPost({ title: '', content: '', platform: 'facebook', status: 'draft', facebook_page_id: '', media_urls: [], campaign_id: '' });
            loadData();
        } else {
            toast.error("Lỗi khi tạo bài viết");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Globe className="w-6 h-6 text-blue-600" />
                        Trung tâm Nội dung
                    </h2>
                    <p className="text-sm text-slate-500">Quản lý bài đăng và kết nối Fanpage</p>
                </div>
                {activeTab === 'posts' && (
                    <button
                        onClick={() => setShowCreatePost(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Tạo bài viết
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Bài đăng & Lịch
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Cấu hình & Kết nối
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'posts' && (
                <div className="space-y-6">
                    {/* Posts List */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {posts.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p>Chưa có bài đăng nào</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Nội dung</th>
                                        <th className="px-6 py-4">Kênh / Fanpage</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Lịch đăng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {posts.map(post => (
                                        <tr key={post.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 line-clamp-1">{post.title}</div>
                                                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{post.content}</div>
                                                {post.campaign && (
                                                    <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-100">
                                                        {post.campaign.title}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    {post.facebook_page?.avatar_url && (
                                                        <img src={post.facebook_page.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                                                    )}
                                                    <span className="text-xs">{post.facebook_page?.name || '---'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${post.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        post.status === 'scheduled' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {post.status === 'published' ? 'Đã đăng' :
                                                        post.status === 'scheduled' ? 'Đã lên lịch' : 'Bản nháp'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {post.scheduled_at
                                                    ? format(new Date(post.scheduled_at), 'HH:mm dd/MM', { locale: vi })
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Tài khoản kết nối</h3>
                                <p className="text-sm text-slate-500">Quản lý các Fanpage đã được cấp quyền</p>
                            </div>
                            <button
                                onClick={() => setIsConnectOpen(true)}
                                className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded-md hover:bg-[#166fe5] transition-colors text-sm font-medium"
                            >
                                <Facebook className="w-4 h-4" />
                                Thêm Fanpage
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                            </div>
                        ) : pages.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Facebook className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-medium">Chưa có Fanpage nào được kết nối</p>
                                <p className="text-sm text-slate-400 mt-1">Bấm nút "Thêm Fanpage" để bắt đầu</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pages.map(page => (
                                    <div key={page.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white relative group">
                                        <img
                                            src={page.avatar_url || "https://placehold.co/50x50"}
                                            alt={page.name}
                                            className="w-12 h-12 rounded-full border border-slate-200"
                                        />
                                        <div>
                                            <div className="font-semibold text-slate-900">{page.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                Đang hoạt động
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mock Connect Modal */}
            {isConnectOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden p-6 space-y-4">
                        <h3 className="text-lg font-bold">Kết nối Fanpage (Giả lập)</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Page ID</label>
                                <input
                                    className="w-full border p-2 rounded text-sm"
                                    placeholder="VD: 100088..."
                                    value={connectForm.page_id}
                                    onChange={e => setConnectForm({ ...connectForm, page_id: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Tên Fanpage</label>
                                <input
                                    className="w-full border p-2 rounded text-sm"
                                    placeholder="VD: Lyhu Official..."
                                    value={connectForm.name}
                                    onChange={e => setConnectForm({ ...connectForm, name: e.target.value })}
                                />
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded">
                                * Lưu ý: Đây là giả lập vì chưa có App ID thật. Token sẽ được sinh ngẫu nhiên.
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setIsConnectOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                            <button onClick={handleConnectMock} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded">Kết nối ngay</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Post Modal */}
            {showCreatePost && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold">Tạo bài viết mới</h3>
                            <button onClick={() => setShowCreatePost(false)} className="text-slate-500 hover:text-slate-700">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Fanpage đăng bài</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                                        value={newPost.facebook_page_id}
                                        onChange={e => setNewPost({ ...newPost, facebook_page_id: e.target.value })}
                                    >
                                        <option value="">-- Chọn Fanpage --</option>
                                        {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Chiến dịch (tùy chọn)</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                                        value={newPost.campaign_id || ''}
                                        onChange={e => setNewPost({ ...newPost, campaign_id: e.target.value })}
                                    >
                                        <option value="">-- Không thuộc chiến dịch --</option>
                                        {campaigns.filter(c => c.status === 'active' || c.status === 'planning').map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Tiêu đề (Nội bộ)</label>
                                <input
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm"
                                    placeholder="Nhập tiêu đề quản lý"
                                    value={newPost.title}
                                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Nội dung bài viết</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm h-32 resize-none"
                                    placeholder="Nhập nội dung sẽ đăng lên Facebook..."
                                    value={newPost.content}
                                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                />
                            </div>

                            {/* Image Placeholder */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">Hình ảnh / Video (Mock URL)</label>
                                <input
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm"
                                    placeholder="https://"
                                    onChange={e => {
                                        if (e.target.value) setNewPost({ ...newPost, media_urls: [e.target.value] });
                                    }}
                                />
                                <p className="text-xs text-slate-400 mt-1">* Phiên bản hiện tại hỗ trợ nhập URL ảnh</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Lên lịch (Để trống nếu muốn đăng ngay)</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm"
                                    onChange={e => setNewPost({ ...newPost, scheduled_at: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-2">
                            <button onClick={() => setShowCreatePost(false)} className="px-4 py-2 border rounded-md text-sm hover:bg-slate-100">Hủy</button>
                            <button
                                onClick={handleCreatePost}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? "Đang xử lý..." : (newPost.scheduled_at ? "Lên lịch đăng" : "Đăng ngay")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
