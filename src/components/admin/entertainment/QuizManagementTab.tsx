"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2, X, Image as ImageIcon, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
    id: string;
    game_code: string;
    question: string;
    image_url?: string;
    correct_answer: string;
    options: any; // JSON array
    explanation?: string;
}

export const QuizManagementTab = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Question | null>(null);

    const supabase = createClient();

    // Default form state
    const [formData, setFormData] = useState<Partial<Question>>({
        game_code: 'quiz_image',
        question: '',
        image_url: '',
        correct_answer: '',
        options: '["", "", "", ""]', // Store as string for easy editing initially
        explanation: ''
    });

    const fetchQuestions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('game_code', 'quiz_image')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Lỗi tải câu hỏi: " + error.message);
        } else {
            setQuestions(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const resetForm = () => {
        setFormData({
            game_code: 'quiz_image',
            question: '',
            image_url: '',
            correct_answer: '',
            options: '["", "", "", ""]',
            explanation: ''
        });
        setEditingItem(null);
    };

    const handleOpenModal = (item?: Question) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                ...item,
                options: JSON.stringify(item.options || [])
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const parsedOptions = JSON.parse(formData.options as string);

            const payload = {
                game_code: formData.game_code,
                question: formData.question,
                image_url: formData.image_url,
                correct_answer: formData.correct_answer,
                options: parsedOptions,
                explanation: formData.explanation
            };

            let error;
            if (editingItem) {
                const { error: updateError } = await supabase
                    .from('quiz_questions')
                    .update(payload)
                    .eq('id', editingItem.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('quiz_questions')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(editingItem ? "Đã cập nhật câu hỏi" : "Đã thêm câu hỏi mới");
            setIsModalOpen(false);
            fetchQuestions();
        } catch (err: any) {
            toast.error("Lỗi: " + (err.message || "Kiểm tra định dạng JSON options"));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xóa câu hỏi này?")) return;
        const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
        if (error) toast.error("Lỗi xóa: " + error.message);
        else {
            toast.success("Đã xóa");
            fetchQuestions();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-500" /> Quản Lý Đuổi Hình Bắt Chữ
                </h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Thêm Câu Hỏi
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {questions.map(q => (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                            {q.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={q.image_url} alt="clue" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-slate-300" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 line-clamp-1">{q.question}</h4>
                            <p className="text-sm text-green-600 font-medium mt-1">Đáp án: {q.correct_answer}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{q.explanation}</p>
                            <div className="text-xs text-slate-400 mt-2 font-mono bg-slate-50 p-1 rounded inline-block">
                                JSON Options: {JSON.stringify(q.options)}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                            <button onClick={() => handleOpenModal(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                {questions.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-400">Chưa có câu hỏi nào.</div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-200 h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
                            <h3 className="font-bold text-slate-800">{editingItem ? 'Sửa Câu Hỏi' : 'Thêm Câu Hỏi'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Câu hỏi</label>
                                <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Link Ảnh (URL)</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.image_url || ''} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                                {formData.image_url && <img src={formData.image_url} alt="preview" className="h-20 w-auto mt-2 rounded border border-slate-200" />}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Đáp án đúng</label>
                                <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.correct_answer} onChange={e => setFormData({ ...formData, correct_answer: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Các lựa chọn (JSON Array)</label>
                                <textarea required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs" rows={3}
                                    value={formData.options as string} onChange={e => setFormData({ ...formData, options: e.target.value })}
                                    placeholder='["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"]' />
                                <p className="text-[10px] text-slate-400 mt-1">Nhập đúng định dạng JSON Array. Ví dụ: ["Cam", "Táo", "Xoài", "Mận"]</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Giải thích (Hiện sau khi trả lời)</label>
                                <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" rows={2}
                                    value={formData.explanation || ''} onChange={e => setFormData({ ...formData, explanation: e.target.value })} />
                            </div>
                        </form>
                        <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0 bg-white rounded-b-xl">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50">Hủy</button>
                            <button onClick={handleSubmit} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
