"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2, X, Keyboard } from 'lucide-react';
import { toast } from 'sonner';

interface TypingText {
    id: string;
    content: string;
    category: string;
    difficulty: string;
}

export const TypingManagementTab = () => {
    const [texts, setTexts] = useState<TypingText[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TypingText | null>(null);

    const supabase = createClient();

    // Default form state
    const [formData, setFormData] = useState<Partial<TypingText>>({
        content: '',
        category: 'General',
        difficulty: 'Medium'
    });

    const fetchTexts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('typing_texts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Lỗi tải dữ liệu: " + error.message);
        } else {
            setTexts(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTexts();
    }, []);

    const resetForm = () => {
        setFormData({
            content: '',
            category: 'General',
            difficulty: 'Medium'
        });
        setEditingItem(null);
    };

    const handleOpenModal = (item?: TypingText) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            content: formData.content,
            category: formData.category,
            difficulty: formData.difficulty
        };

        let error;
        if (editingItem) {
            const { error: updateError } = await supabase
                .from('typing_texts')
                .update(payload)
                .eq('id', editingItem.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('typing_texts')
                .insert([payload]);
            error = insertError;
        }

        if (error) toast.error("Lỗi: " + error.message);
        else {
            toast.success(editingItem ? "Đã cập nhật" : "Đã thêm mới");
            setIsModalOpen(false);
            fetchTexts();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xóa đoạn văn mẫu này?")) return;
        const { error } = await supabase.from('typing_texts').delete().eq('id', id);
        if (error) toast.error("Lỗi xóa: " + error.message);
        else {
            toast.success("Đã xóa");
            fetchTexts();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-indigo-500" /> Quản Lý Đua Gõ
                </h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Thêm Văn Bản
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-4 py-3 w-1/2">Nội dung</th>
                            <th className="px-4 py-3">Danh mục</th>
                            <th className="px-4 py-3">Độ khó</th>
                            <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {texts.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <p className="line-clamp-2 text-slate-800 font-mono text-xs">{item.content}</p>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{item.category}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${item.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                            item.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {item.difficulty}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-slate-800">{editingItem ? 'Sửa Văn Bản' : 'Thêm Văn Bản'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung văn bản</label>
                                <textarea required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                                    value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="General">General (Chung)</option>
                                        <option value="Quotes">Quotes (Danh ngôn)</option>
                                        <option value="Code">Code (Mã nguồn)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Độ khó</label>
                                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                                        <option value="Easy">Easy (Dễ)</option>
                                        <option value="Medium">Medium (Vừa)</option>
                                        <option value="Hard">Hard (Khó)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50">Hủy</button>
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
