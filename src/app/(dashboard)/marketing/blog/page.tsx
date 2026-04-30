"use client";

import React, { useEffect, useState } from 'react';
import { BlogPost, getBlogPosts, deleteBlogPost } from '@/lib/blogStore';
import { Plus, Search, Edit, Trash2, Globe, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function BlogCMSPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await getBlogPosts();
            setPosts(data);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Bạn có chắc chắn muốn xoá bài viết "${title}"?`)) {
            try {
                await deleteBlogPost(id);
                setPosts(posts.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting post:", error);
                alert("Lỗi khi xoá bài viết.");
            }
        }
    };

    const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tin tức & Blog</h1>
                    <p className="text-gray-500 text-sm mt-1">Quản lý bài viết, tối ưu SEO & AEO (AI).</p>
                </div>
                <Link
                    href="/marketing/blog/new"
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Viết bài mới</span>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                                <th className="p-4 font-medium">Bài viết</th>
                                <th className="p-4 font-medium w-48">Trạng thái</th>
                                <th className="p-4 font-medium w-48">Ngày xuất bản</th>
                                <th className="p-4 font-medium w-32 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        Chưa có bài viết nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredPosts.map(post => (
                                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 line-clamp-1">{post.title}</div>
                                            <div className="text-xs text-gray-500 mt-1 flex gap-2 items-center">
                                                <span>/tin-tuc/{post.slug}</span>
                                                {post.ai_summary && (
                                                    <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 font-medium">
                                                        <CheckCircle2 className="w-3 h-3" /> AEO Optimized
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {post.status === 'published' ? (
                                                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium border border-green-200">
                                                    <Globe className="w-3.5 h-3.5" /> Xuất bản
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                                                    <FileText className="w-3.5 h-3.5" /> Bản nháp
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {post.published_at ? new Date(post.published_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <Link
                                                href={`/marketing/blog/${post.id}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(post.id, post.title)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg inline-flex transition-colors"
                                                title="Xoá"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
