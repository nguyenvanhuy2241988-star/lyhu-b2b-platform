"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, Sparkles, Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useToast } from '@/components/ui/toast';

export default function ScriptEditor() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const isNew = params.id === 'new';

    const [form, setForm] = useState({
        title: '',
        script_type: 'tiktok',
        status: 'draft',
        estimated_duration_sec: 30,
        notes: '',
        content: ''
    });

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    
    // AI Form State
    const [aiTopic, setAiTopic] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (!isNew) {
            fetchScript();
        }
    }, [isNew]);

    const fetchScript = async () => {
        const { data, error } = await supabase
            .from('media_scripts')
            .select('*')
            .eq('id', params.id)
            .single();

        if (data && !error) {
            setForm(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const userRes = await supabase.auth.getUser();
            const userId = userRes.data.user?.id;

            if (!form.title) {
                showToast("Vui lòng nhập tên kịch bản", 'error');
                setSaving(false);
                return;
            }

            if (isNew) {
                const { data, error } = await supabase
                    .from('media_scripts')
                    .insert({
                        ...form,
                        created_by: userId
                    })
                    .select('id')
                    .single();

                if (error) throw error;
                showToast('Đã lưu kịch bản mới!', 'success');
                router.replace(`/media/scripts/${data.id}`);
            } else {
                const { error } = await supabase
                    .from('media_scripts')
                    .update({
                        title: form.title,
                        content: form.content,
                        script_type: form.script_type,
                        status: form.status,
                        estimated_duration_sec: form.estimated_duration_sec,
                        notes: form.notes,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', params.id);

                if (error) throw error;
                showToast('Đã cập nhật kịch bản thành công!', 'success');
            }
        } catch (error: any) {
            showToast(error.message || 'Lỗi khi lưu', 'error');
        }
        setSaving(false);
    };

    const handleAIGenerate = async () => {
        if (!aiTopic) {
            showToast("Hãy nhập một ý tưởng để AI làm việc nhé!", 'error');
            return;
        }

        setGenerating(true);
        showToast("AI đang lên ý tưởng, vui lòng đợi xíu...", 'info');
        try {
            const res = await fetch('/api/ai/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: aiTopic,
                    duration: form.estimated_duration_sec
                })
            });

            const data = await res.json();
            if (data.success) {
                setForm(prev => ({
                    ...prev,
                    title: data.title || prev.title || 'Untitled AI Script',
                    content: data.html // Inject HTML 2-column format into the editor
                }));
                showToast("AI đã hoàn thành Form kịch bản 2 cột!", 'success');
            } else {
                showToast(data.error || "Lỗi khi gọi AI", 'error');
            }
        } catch (e) {
            showToast("Lỗi kết nối máy chủ AI", 'error');
        }
        setGenerating(false);
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Đang tải...</div>;

    return (
        <div className="p-6 max-w-[1400px] mx-auto h-[calc(100vh-80px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/media/scripts')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <input 
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({...form, title: e.target.value})}
                        placeholder="Nhập tên kịch bản..."
                        className="text-2xl font-bold border-none bg-transparent focus:ring-0 p-0 placeholder-gray-300 w-[500px]"
                    />
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-slate-900 hover:bg-black text-white font-medium rounded-lg shadow-sm flex items-center transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Lưu kịch bản
                </button>
            </div>

            <div className="flex gap-6 h-full min-h-0">
                {/* Left: Editor */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
                    <RichTextEditor 
                        content={form.content}
                        onChange={(html) => setForm({...form, content: html})}
                        placeholder="Nội dung kịch bản (Bạn có thể dùng AI để sinh bảng 2 cột Hình Ảnh - Âm Thanh)"
                    />
                </div>

                {/* Right: Sidebar & AI Tool */}
                <div className="w-[380px] flex-shrink-0 space-y-4 overflow-y-auto pr-2 pb-10">
                    {/* Block AI Generator */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <Sparkles className="w-24 h-24 text-indigo-500" />
                        </div>
                        <h3 className="font-bold text-indigo-900 mb-2 flex items-center text-sm">
                            <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" /> Kỹ sư AI Kịch Bản
                        </h3>
                        <p className="text-xs text-indigo-700/80 mb-3 leading-relaxed">
                            Nhập 1 ý tưởng ngắn gọn, AI Gemini sẽ phân tích tư duy Đạo Diễn và tự động sinh Form kịch bản Tiktok/Reels 2 cột tiêu chuẩn (Hình Ảnh - Lời Thoại).
                        </p>
                        <textarea
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="VD: Quay 1 video hài 30s bá đạo để bán Bánh Tráng Bơ chi nhánh Quận 1..."
                            className="w-full h-24 p-3 text-sm rounded-lg border-indigo-200 bg-white/80 focus:ring-indigo-500 focus:border-indigo-500 placeholder-indigo-300 resize-none"
                        ></textarea>
                        <button 
                            onClick={handleAIGenerate}
                            disabled={generating}
                            className="mt-3 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex justify-center items-center disabled:opacity-50 transition-colors"
                        >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Tạo Form Kịch bản
                        </button>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 border-l-4 border-gray-400 pl-2">Thông tin (Metadata)</h3>
                        
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Loại nền tảng</label>
                            <select 
                                value={form.script_type}
                                onChange={(e) => setForm({...form, script_type: e.target.value})}
                                className="w-full p-2 border-gray-300 rounded-lg text-sm bg-gray-50"
                            >
                                <option value="tiktok">TikTok Video</option>
                                <option value="facebook_reels">Facebook Reels</option>
                                <option value="youtube_shorts">YouTube Shorts</option>
                                <option value="promo_video">Video Promo (Ngang)</option>
                                <option value="concept">Concept Định hướng</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Trạng thái kịch bản</label>
                            <select 
                                value={form.status}
                                onChange={(e) => setForm({...form, status: e.target.value})}
                                className="w-full p-2 border-gray-300 rounded-lg text-sm bg-gray-50 font-medium"
                            >
                                <option value="draft">Bản nháp</option>
                                <option value="approved">Chốt / Đã duyệt</option>
                                <option value="shooting">Mang đi quay</option>
                                <option value="completed">Đã hoàn thành</option>
                                <option value="cancelled">Đã huỷ</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Thời lượng (Giây)</label>
                            <input 
                                type="number" 
                                value={form.estimated_duration_sec}
                                onChange={(e) => setForm({...form, estimated_duration_sec: parseInt(e.target.value) || 0})}
                                className="w-full p-2 border-gray-300 rounded-lg text-sm bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Ghi chú Edit / Casting</label>
                            <textarea 
                                value={form.notes}
                                onChange={(e) => setForm({...form, notes: e.target.value})}
                                rows={3}
                                placeholder="Ghi chú nhạc, tone màu, KOL..."
                                className="w-full p-2 border-gray-300 rounded-lg text-sm bg-gray-50 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
