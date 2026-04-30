"use client";

import React, { useEffect, useState } from 'react';
import { AINewsTopic, getAITopics, createAITopic, updateAITopic, deleteAITopic } from '@/lib/aiTopicsStore';
import { Plus, Search, Trash2, Edit2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AITopicsPage() {
    const [topics, setTopics] = useState<AINewsTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [newTopic, setNewTopic] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadTopics();
    }, []);

    const loadTopics = async () => {
        setLoading(true);
        try {
            const data = await getAITopics();
            setTopics(data);
        } catch (error) {
            console.error("Error loading AI topics:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTopic.trim()) return;
        
        setIsSubmitting(true);
        try {
            const topic = await createAITopic(newTopic.trim());
            setTopics([...topics, topic]);
            setNewTopic("");
        } catch (error) {
            console.error("Error adding topic:", error);
            alert("Lỗi khi thêm chủ đề mới.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setTopics(topics.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
            await updateAITopic(id, { is_active: !currentStatus });
        } catch (error) {
            console.error("Error toggling topic:", error);
            // Revert on error
            setTopics(topics.map(t => t.id === id ? { ...t, is_active: currentStatus } : t));
            alert("Lỗi khi cập nhật trạng thái.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xoá chủ đề này? Tòa soạn AI sẽ không dùng chủ đề này để viết bài nữa.")) return;
        
        try {
            await deleteAITopic(id);
            setTopics(topics.filter(t => t.id !== id));
        } catch (error) {
            console.error("Error deleting topic:", error);
            alert("Lỗi khi xoá chủ đề.");
        }
    };

    const filteredTopics = topics.filter(t => t.content.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Cấu hình Chủ đề Tòa soạn AI</h1>
                <p className="text-gray-500 text-sm mt-1">Quản lý kho chủ đề để Tòa soạn AI tự động bốc thăm và viết tin tức đa dạng mỗi ngày.</p>
            </div>

            {/* Add New Topic Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary-600" /> Thêm chủ đề mới
                </h2>
                <form onSubmit={handleAddTopic} className="flex gap-3">
                    <input 
                        type="text" 
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="Nhập nội dung chủ đề... (VD: Tin tức về thị trường trái cây nhập khẩu)"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={isSubmitting}
                    />
                    <button 
                        type="submit"
                        disabled={isSubmitting || !newTopic.trim()}
                        className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Thêm vào kho"}
                    </button>
                </form>
            </div>

            {/* Topics List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                        Tổng cộng: <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-sm">{topics.length}</span>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm chủ đề..."
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
                                <th className="p-4 font-medium">Nội dung Chủ đề (AI Focus Area)</th>
                                <th className="p-4 font-medium w-32 text-center">Trạng thái</th>
                                <th className="p-4 font-medium w-24 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredTopics.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">
                                        Không tìm thấy chủ đề nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredTopics.map((topic, index) => (
                                    <tr key={topic.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex gap-3">
                                                <span className="text-gray-400 font-medium">{index + 1}.</span>
                                                <span className="text-gray-900 font-medium">{topic.content}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleToggleActive(topic.id, topic.is_active)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                                    topic.is_active 
                                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                                }`}
                                            >
                                                {topic.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                {topic.is_active ? 'Đang Bật' : 'Tạm Dừng'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(topic.id)}
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
