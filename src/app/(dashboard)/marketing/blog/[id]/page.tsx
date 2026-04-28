"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlogPost, BlogCategory, getBlogPosts, getBlogPostById, saveBlogPost, getBlogCategories, generateSlug } from '@/lib/blogStore';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth/AuthProvider';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { ArrowLeft, Save, Loader2, Sparkles, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function BlogEditorPage({ params }: { params: { id: string } }) {
    const isNew = params.id === 'new';
    const router = useRouter();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    
    const [post, setPost] = useState<Partial<BlogPost>>({
        title: '',
        slug: '',
        content: '',
        category_id: '',
        video_url: '',
        status: 'draft',
        ai_summary: '',
        meta_title: '',
        meta_description: '',
        keywords: '',
        faq_data: []
    });

    // Helper for FAQ
    const [faqInput, setFaqInput] = useState({ question: '', answer: '' });

    useEffect(() => {
        loadData();
    }, [params.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const cats = await getBlogCategories();
            setCategories(cats);
            
            if (!isNew) {
                const data = await getBlogPostById(params.id);
                if (data) {
                    setPost(data);
                } else {
                    alert("Bài viết không tồn tại!");
                    router.push('/marketing/blog');
                }
            }
        } catch (error) {
            console.error("Error loading blog data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (status: 'draft' | 'published') => {
        if (!post.title || !post.slug) {
            alert("Vui lòng nhập tiêu đề và đường dẫn (slug)!");
            return;
        }

        setSaving(true);
        try {
            const postDataToSave: Partial<BlogPost> = {
                ...post,
                status,
                author_id: post.author_id || user?.id,
            };
            
            // Generate slug if empty (safety fallback)
            if (!postDataToSave.slug) {
                postDataToSave.slug = generateSlug(postDataToSave.title || '');
            }
            
            // Fix UUID error: empty string must be converted to null
            if (!postDataToSave.category_id) {
                postDataToSave.category_id = null;
            }

            await saveBlogPost(postDataToSave);
            alert(`Đã lưu bài viết (${status === 'published' ? 'Đã xuất bản' : 'Bản nháp'})`);
            router.push('/marketing/blog');
        } catch (error: any) {
            console.error("Error saving post:", error);
            alert("Lỗi khi lưu bài viết: " + (error.message || ''));
        } finally {
            setSaving(false);
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setPost(prev => ({
            ...prev,
            title,
            slug: isNew ? generateSlug(title) : prev.slug // auto-update slug only for new posts
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `blog-thumbnails/${fileName}`;

            // Assuming we have a 'public' storage bucket. Change if different.
            const { error: uploadError, data } = await supabase.storage
                .from('public')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            setPost(prev => ({ ...prev, thumbnail_url: publicUrlData.publicUrl }));
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('Lỗi tải ảnh lên: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const addFaq = () => {
        if (!faqInput.question || !faqInput.answer) return;
        const currentFaqs = Array.isArray(post.faq_data) ? post.faq_data : [];
        setPost(prev => ({
            ...prev,
            faq_data: [...currentFaqs, { ...faqInput }]
        }));
        setFaqInput({ question: '', answer: '' });
    };

    const removeFaq = (index: number) => {
        const currentFaqs = Array.isArray(post.faq_data) ? [...post.faq_data] : [];
        currentFaqs.splice(index, 1);
        setPost(prev => ({ ...prev, faq_data: currentFaqs }));
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/marketing/blog" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isNew ? 'Viết bài mới' : 'Chỉnh sửa bài viết'}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={saving}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                    >
                        Lưu nháp
                    </button>
                    <button
                        onClick={() => handleSave('published')}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        Xuất bản
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề bài viết <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={post.title || ''}
                                onChange={handleTitleChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg font-medium"
                                placeholder="Nhập tiêu đề..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn tĩnh (Slug) <span className="text-red-500">*</span></label>
                            <div className="flex items-center">
                                <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2 rounded-l-lg text-gray-500 text-sm">/tin-tuc/</span>
                                <input
                                    type="text"
                                    value={post.slug || ''}
                                    onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                                    className="flex-1 px-3 py-2 rounded-r-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                                    placeholder="duong-dan-bai-viet"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Nội dung bài viết <span className="text-red-500">*</span></label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden min-h-[400px]">
                            <RichTextEditor
                                content={post.content || ''}
                                onChange={(content) => setPost(prev => ({ ...prev, content }))}
                                placeholder="Viết nội dung tại đây..."
                            />
                        </div>
                    </div>

                    {/* FAQ Schema builder */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <div className="flex items-start gap-2 text-indigo-600 mb-2">
                            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold">Hỏi đáp (FAQ Schema)</h3>
                                <p className="text-sm text-gray-600">Thêm câu hỏi và trả lời để Google hiển thị dạng hỏi đáp trên kết quả tìm kiếm và các AI Bots dễ dàng trích xuất dữ liệu.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {(Array.isArray(post.faq_data) ? post.faq_data : []).map((faq, index) => (
                                <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg relative pr-10">
                                    <div className="font-medium text-gray-800 text-sm">Hỏi: {faq.question}</div>
                                    <div className="text-gray-600 text-sm mt-1">Đáp: {faq.answer}</div>
                                    <button
                                        onClick={() => removeFaq(index)}
                                        className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 space-y-3 mt-4">
                            <input
                                type="text"
                                placeholder="Câu hỏi..."
                                value={faqInput.question}
                                onChange={e => setFaqInput(p => ({ ...p, question: e.target.value }))}
                                className="w-full px-3 py-2 rounded border border-gray-300 text-sm"
                            />
                            <textarea
                                placeholder="Câu trả lời..."
                                value={faqInput.answer}
                                onChange={e => setFaqInput(p => ({ ...p, answer: e.target.value }))}
                                className="w-full px-3 py-2 rounded border border-gray-300 text-sm min-h-[80px]"
                            />
                            <button
                                onClick={addFaq}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
                            >
                                Thêm FAQ
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Settings & SEO) */}
                <div className="space-y-6">
                    {/* Categories */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Danh mục</h3>
                        <select
                            value={post.category_id || ''}
                            onChange={(e) => setPost(prev => ({ ...prev, category_id: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Thumbnail */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Ảnh đại diện (Thumbnail URL)</h3>
                        
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={post.thumbnail_url || ''}
                                onChange={(e) => setPost(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm"
                                placeholder="Nhập link ảnh hoặc..."
                            />
                            <div className="relative shrink-0">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload} 
                                    disabled={uploadingImage}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                                />
                                <button 
                                    type="button" 
                                    disabled={uploadingImage}
                                    className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tải lên'}
                                </button>
                            </div>
                        </div>

                        {post.thumbnail_url && (
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <img src={post.thumbnail_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Video URL */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Video hướng dẫn (Tùy chọn)</h3>
                        <p className="text-xs text-gray-500 mb-2">Nhập link Youtube hoặc link Google Drive có đuôi preview.</p>
                        <input
                            type="text"
                            value={post.video_url || ''}
                            onChange={(e) => setPost(prev => ({ ...prev, video_url: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="https://www.youtube.com/embed/..."
                        />
                    </div>

                    {/* AEO settings */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl shadow-sm border border-purple-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <h3 className="font-semibold text-purple-900">AEO (AI Optimization)</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-purple-800 mb-1">Tóm tắt cho AI (TL;DR)</label>
                                <textarea
                                    value={post.ai_summary || ''}
                                    onChange={(e) => setPost(prev => ({ ...prev, ai_summary: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm min-h-[100px] focus:ring-purple-500 focus:border-purple-500 bg-white"
                                    placeholder="Viết 1-2 câu tóm tắt ý chính nhất để ChatGPT/Gemini dùng làm câu trả lời..."
                                />
                            </div>
                            <div className="flex items-start gap-2 bg-white/60 p-2 rounded text-xs text-purple-800">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>Đoạn tóm tắt này sẽ được nhúng ngầm qua Schema, không hiện trên giao diện người dùng nhưng AI Bot sẽ ưu tiên đọc.</p>
                            </div>
                        </div>
                    </div>

                    {/* SEO Settings */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h3 className="font-semibold text-gray-900">SEO Truyền thống</h3>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
                            <input
                                type="text"
                                value={post.meta_title || ''}
                                onChange={(e) => setPost(prev => ({ ...prev, meta_title: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                                placeholder="Tiêu đề hiển thị trên Google..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
                            <textarea
                                value={post.meta_description || ''}
                                onChange={(e) => setPost(prev => ({ ...prev, meta_description: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm min-h-[80px]"
                                placeholder="Mô tả ngắn hiển thị dưới link..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Keywords</label>
                            <input
                                type="text"
                                value={post.keywords || ''}
                                onChange={(e) => setPost(prev => ({ ...prev, keywords: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                                placeholder="Cách nhau bằng dấu phẩy..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
