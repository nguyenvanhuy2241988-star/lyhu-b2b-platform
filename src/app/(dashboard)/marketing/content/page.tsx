'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, FileText, Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

interface Post {
    id: string;
    title: string;
    content: string;
    platform: string;
    status: 'draft' | 'scheduled' | 'published';
    scheduled_at: string;
}

export default function ContentPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);

    // Form State
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        platform: 'facebook',
        status: 'draft',
        scheduled_at: ''
    });

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('marketing_posts').select('*').order('scheduled_at', { ascending: true });
        if (data) setPosts(data as any);
    };

    const handleCreate = async () => {
        const supabase = createClient();
        const { error } = await supabase.from('marketing_posts').insert([newPost]);
        if (error) {
            alert('Lỗi: ' + error.message);
        } else {
            setIsInternalModalOpen(false);
            loadPosts();
            setNewPost({ title: '', content: '', platform: 'facebook', status: 'draft', scheduled_at: '' });
        }
    };

    const statusColors = {
        draft: 'bg-slate-100 text-slate-600',
        scheduled: 'bg-amber-50 text-amber-600',
        published: 'bg-green-50 text-green-600'
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Content</h1>
                    <p className="text-slate-500">Lịch đăng bài và nội dung truyền thông</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Danh sách</button>
                        <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 rounded-md transition ${viewMode === 'calendar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Lịch</button>
                    </div>
                    <button
                        onClick={() => setIsInternalModalOpen(true)}
                        className="flex items-center gap-2 bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 transition"
                    >
                        <Plus className="w-4 h-4" /> Tạo bài viết
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white border rounded-xl shadow-sm overflow-hidden p-0">
                {viewMode === 'list' && (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Tiêu đề</th>
                                <th className="px-6 py-4">Nền tảng</th>
                                <th className="px-6 py-4">Lịch đăng</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {posts.map(post => (
                                <tr key={post.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{post.title}</div>
                                        <div className="text-xs text-slate-500 line-clamp-1">{post.content}</div>
                                    </td>
                                    <td className="px-6 py-4 capitalize text-slate-600">{post.platform}</td>
                                    <td className="px-6 py-4 flex items-center gap-2 text-slate-600">
                                        {post.scheduled_at ? (
                                            <>
                                                <Clock className="w-4 h-4" />
                                                {new Date(post.scheduled_at).toLocaleDateString('vi-VN')} {new Date(post.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </>
                                        ) : (
                                            <span className="text-slate-400 italic">Chưa lên lịch</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${statusColors[post.status]}`}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {posts.length === 0 && (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400">Chưa có bài viết nào</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {viewMode === 'calendar' && (
                    <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[400px]">
                        <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p>Chế độ xem Lịch đang được phát triển.</p>
                        <p className="text-sm">Vui lòng sử dụng chế độ Danh sách.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isInternalModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">Soạn bài viết mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                                <input className="w-full border rounded-lg p-2" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} placeholder="VD: Khuyến mãi Tết 2026..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nền tảng</label>
                                <select className="w-full border rounded-lg p-2" value={newPost.platform} onChange={e => setNewPost({ ...newPost, platform: e.target.value })}>
                                    <option value="facebook">Facebook</option>
                                    <option value="tiktok">TikTok</option>
                                    <option value="website">Website / Blog</option>
                                    <option value="zalo">Zalo OA</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nội dung</label>
                                <textarea rows={4} className="w-full border rounded-lg p-2" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} placeholder="Nội dung bài viết..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                    <select className="w-full border rounded-lg p-2" value={newPost.status} onChange={e => setNewPost({ ...newPost, status: e.target.value })}>
                                        <option value="draft">Bản nháp</option>
                                        <option value="scheduled">Đã lên lịch</option>
                                        <option value="published">Đã đăng</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Thời gian đăng</label>
                                    <input type="datetime-local" className="w-full border rounded-lg p-2" value={newPost.scheduled_at} onChange={e => setNewPost({ ...newPost, scheduled_at: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end mt-6">
                                <button onClick={() => setIsInternalModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Hủy</button>
                                <button onClick={handleCreate} className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700">Lưu bài viết</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
