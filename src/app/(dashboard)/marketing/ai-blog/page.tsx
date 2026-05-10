'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2, CircleDashed, XCircle, Settings, Play } from 'lucide-react';
import { BlogCategory } from '@/lib/blogStore';

interface TopicItem {
    id: string;
    text: string;
    status: 'pending' | 'generating' | 'success' | 'failed';
    error?: string;
}

export default function AIBlogPage() {
    const [topicsInput, setTopicsInput] = useState('');
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    
    const [topicsList, setTopicsList] = useState<TopicItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    // Settings
    const [pexelsKey, setPexelsKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        loadCategories();
        // Load keys from local storage just for UI convenience, but the API uses process.env
        // Wait, Vercel handles env vars. The API uses process.env, so we don't need to pass them from UI unless the user hasn't set them up on Vercel.
        // Actually, let's just rely on process.env on the server.
    }, []);

    async function loadCategories() {
        const { data } = await supabase.from('blog_categories').select('*').order('sort_order');
        if (data) {
            setCategories(data);
            if (data.length > 0) setSelectedCategoryId(data[0].id);
        }
    }

    const handlePrepareTopics = () => {
        const lines = topicsInput.split('\n').map(t => t.trim()).filter(t => t.length > 5);
        const newItems: TopicItem[] = lines.map((text, idx) => ({
            id: `topic-${Date.now()}-${idx}`,
            text,
            status: 'pending'
        }));
        setTopicsList(newItems);
    };

    const startGenerating = async () => {
        if (topicsList.length === 0) return;
        setIsGenerating(true);
        setProgress(0);

        const now = new Date();
        let completedCount = 0;

        for (let i = 0; i < topicsList.length; i++) {
            const item = topicsList[i];
            if (item.status === 'success') {
                completedCount++;
                setProgress(Math.round((completedCount / topicsList.length) * 100));
                continue;
            }

            // Update status to generating
            setTopicsList(prev => prev.map(t => t.id === item.id ? { ...t, status: 'generating' } : t));

            // Publish date schedule: 1 post per day starting today
            const publishDate = new Date(now);
            publishDate.setDate(now.getDate() + completedCount);

            try {
                const res = await fetch('/api/marketing/ai-blog', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: item.text,
                        categoryId: selectedCategoryId,
                        publishDate: publishDate.toISOString()
                    })
                });

                const data = await res.json();
                
                if (data.success) {
                    setTopicsList(prev => prev.map(t => t.id === item.id ? { ...t, status: 'success' } : t));
                } else {
                    setTopicsList(prev => prev.map(t => t.id === item.id ? { ...t, status: 'failed', error: data.error } : t));
                }
            } catch (err: any) {
                setTopicsList(prev => prev.map(t => t.id === item.id ? { ...t, status: 'failed', error: err.message } : t));
            }

            completedCount++;
            setProgress(Math.round((completedCount / topicsList.length) * 100));
            
            // Wait 2s to prevent rate limits
            await new Promise(r => setTimeout(r, 2000));
        }

        setIsGenerating(false);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Cỗ Máy Tự Động Viết Bài (AI Blog)</h1>
                    <p className="text-gray-500 mt-1">Sử dụng Gemini 1.5 Pro và Pexels API để sinh bài viết chuẩn SEO hàng loạt.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* LẼ TRÁI: NHẬP LIỆU */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <h2 className="font-semibold text-gray-700 mb-3">1. Nhập danh sách Tiêu đề</h2>
                        <textarea 
                            className="w-full h-64 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0B9679] outline-none resize-none"
                            placeholder="Dán danh sách tiêu đề vào đây, mỗi dòng 1 bài. Ví dụ:&#10;Kinh nghiệm mở siêu thị mini&#10;Kẹo chua UHI bán ở đâu&#10;..."
                            value={topicsInput}
                            onChange={(e) => setTopicsInput(e.target.value)}
                            disabled={isGenerating}
                        />
                        
                        <div className="mt-4">
                            <label className="block text-sm text-gray-600 mb-1">Chuyên mục đăng bài</label>
                            <select 
                                className="w-full p-2 border border-gray-200 rounded-lg"
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                disabled={isGenerating}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <button 
                            className="w-full mt-4 px-4 py-2 rounded-lg font-medium bg-gray-800 hover:bg-gray-900 text-white transition disabled:opacity-50"
                            onClick={handlePrepareTopics}
                            disabled={isGenerating || topicsInput.trim().length === 0}
                        >
                            Đưa vào danh sách chờ
                        </button>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                        <strong>Lưu ý quan trọng:</strong>
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                            <li>Mỗi phút AI viết được tối đa 2 bài (Do giới hạn bản miễn phí).</li>
                            <li>Hệ thống sẽ tự động hẹn giờ đăng rải rác mỗi ngày 1 bài để Google đánh giá tốt.</li>
                        </ul>
                    </div>
                </div>

                {/* LẼ PHẢI: TIẾN TRÌNH */}
                <div className="md:col-span-2">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-gray-700">2. Danh sách Chờ ({topicsList.length} bài)</h2>
                            <button 
                                onClick={startGenerating}
                                disabled={isGenerating || topicsList.length === 0}
                                className="flex items-center bg-[#0B9679] hover:bg-[#087f65] text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <CircleDashed className="w-4 h-4 animate-spin" />
                                        Đang chạy...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        Bắt đầu Viết
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Thanh tiến trình */}
                        {(isGenerating || progress > 0) && (
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Tiến độ hoàn thành</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-[#0B9679] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg">
                            {topicsList.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                                    Chưa có bài viết nào trong danh sách.
                                </div>
                            ) : (
                                <>
                                    <div className="hidden lg:block">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Tiêu đề bài viết</th>
                                                <th className="px-4 py-3 font-medium w-32">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {topicsList.map((topic, index) => (
                                                <tr key={topic.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-gray-800">{topic.text}</span>
                                                        {topic.error && <p className="text-xs text-red-500 mt-1">{topic.error}</p>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {topic.status === 'pending' && <span className="flex items-center text-gray-400 gap-1"><CircleDashed className="w-4 h-4" /> Chờ chạy</span>}
                                                        {topic.status === 'generating' && <span className="flex items-center text-blue-500 gap-1 font-medium"><CircleDashed className="w-4 h-4 animate-spin" /> Đang viết...</span>}
                                                        {topic.status === 'success' && <span className="flex items-center text-green-500 gap-1 font-medium"><CheckCircle2 className="w-4 h-4" /> Hoàn thành</span>}
                                                        {topic.status === 'failed' && <span className="flex items-center text-red-500 gap-1 font-medium"><XCircle className="w-4 h-4" /> Lỗi</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Mobile Card List View */}
                                    <div className="lg:hidden divide-y divide-gray-100">
                                        {topicsList.map((topic, index) => (
                                            <div key={topic.id} className="p-4 hover:bg-gray-50">
                                                <div className="font-medium text-gray-800 mb-2">{topic.text}</div>
                                                {topic.error && <p className="text-xs text-red-500 mb-2">{topic.error}</p>}
                                                <div className="text-xs">
                                                    {topic.status === 'pending' && <span className="flex items-center text-gray-400 gap-1"><CircleDashed className="w-4 h-4" /> Chờ chạy</span>}
                                                    {topic.status === 'generating' && <span className="flex items-center text-blue-500 gap-1 font-medium"><CircleDashed className="w-4 h-4 animate-spin" /> Đang viết...</span>}
                                                    {topic.status === 'success' && <span className="flex items-center text-green-500 gap-1 font-medium"><CheckCircle2 className="w-4 h-4" /> Hoàn thành</span>}
                                                    {topic.status === 'failed' && <span className="flex items-center text-red-500 gap-1 font-medium"><XCircle className="w-4 h-4" /> Lỗi</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
