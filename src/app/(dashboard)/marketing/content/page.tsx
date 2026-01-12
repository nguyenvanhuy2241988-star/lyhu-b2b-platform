"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FacebookPage, fetchFacebookPages, saveFacebookPage } from "@/lib/marketingStore";
import { Loader2, Plus, Facebook, Check, Trash2, Globe, Settings, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function MarketingContentPage() {
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Mock Connect Modal State
    const [isConnectOpen, setIsConnectOpen] = useState(false);
    const [connectForm, setConnectForm] = useState({
        page_id: '',
        name: '',
        access_token: 'mock_token_' + Math.floor(Math.random() * 10000),
        avatar_url: 'https://placehold.co/100x100?text=Page'
    });

    const loadPages = async () => {
        setIsLoading(true);
        const data = await fetchFacebookPages(session?.access_token);
        setPages(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (session?.access_token) loadPages();
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
            loadPages();
        } else {
            toast.error("Lỗi kết nối");
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

            {activeTab === 'posts' && (
                <div className="text-center py-12 text-slate-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-900">Quản lý bài đăng</h3>
                    <p>Tính năng đang được phát triển...</p>
                    <p className="text-sm mt-2">(Vui lòng kết nối Fanpage trước ở tab Cấu hình)</p>
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
        </div>
    );
}
