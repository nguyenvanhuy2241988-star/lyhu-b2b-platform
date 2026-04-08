"use client";

import { useState } from "react";
import { X, Save, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface CampaignBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

export default function CampaignBuilderModal({ isOpen, onClose, onSaved }: CampaignBuilderModalProps) {
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Default initial step
    const [tasks, setTasks] = useState<{ script_name: string, args: string, id: number }[]>([]);
    
    // Unique ID counter for rendering list locally before save
    const [counter, setCounter] = useState(0);

    const availableScripts = [
        { id: 'execute_search_add.js', label: '🔍 Săn Khách Quanh Đây' },
        { id: 'group_finder.js', label: '👥 Quét Nhóm Tiềm Năng' },
        { id: 'invite_friend_page.js', label: '📩 Mời Bạn Like Page' },
        { id: 'execute_post_scan.js', label: '🕵️ Quét Comment Bài Viết' },
        { id: 'execute_suggestion_scan.js', label: '🌊 Kết bạn Theo Đề Xuất (Gợi ý)' },
        { id: 'execute_rival_scan.js', label: '🎯 Cướp Khách Đối Thủ' },
        { id: 'auto_post_profile.js', label: '✍️ Đăng Bài Cá Nhân (Auto Post)' },
        { id: 'auto_post_group.js', label: '📢 Đăng Bài Hội Nhóm (Seeding)' },
        { id: 'auto_comment_group.js', label: '💬 Đi Comment Dạo (Top Đỉnh)' },
        { id: 'defense_engine.js', label: '🛡️ Bật Lá Chắn Ảo (Nuôi Trast)' },
        { id: 'manual_login.js', label: '🔑 Tạm dừng để Đăng Nhập Tay' }
    ];

    if (!isOpen) return null;

    const handleAddTask = () => {
        setTasks([...tasks, { script_name: 'defense_engine.js', args: '', id: counter }]);
        setCounter(counter + 1);
    };

    const handleRemoveTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleUpdateTask = (id: number, key: 'script_name' | 'args', value: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, [key]: value } : t));
    };

    const moveTask = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === tasks.length - 1) return;
        
        const newTasks = [...tasks];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        
        const temp = newTasks[index];
        newTasks[index] = newTasks[swapIndex];
        newTasks[swapIndex] = temp;
        
        setTasks(newTasks);
    };

    const handleSave = async () => {
        if (!name.trim()) return toast.error("Vui lòng nhập tên chiến dịch");
        if (tasks.length === 0) return toast.error("Chiến dịch phải có ít nhất 1 lệnh (bước)");

        setIsSaving(true);
        const cleanTasks = tasks.map(t => ({ script_name: t.script_name, args: t.args }));
        
        const { error } = await supabase.from('bot_campaigns').insert({
            name,
            tasks: cleanTasks,
            status: 'active'
        });

        if (error) {
            toast.error("Lỗi lưu chiến dịch: " + error.message);
        } else {
            toast.success("✅ Đã tạo Template Chiến Dịch Kép!");
            onSaved();
            onClose();
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-xl shrink-0">
                    <h3 className="font-bold text-lg text-slate-800">Xây Dựng Chiến Dịch (Macro)</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    
                    <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tên Chiến Dịch (Gợi Nhớ)</label>
                        <input
                            type="text"
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium"
                            placeholder="VD: Cày Clone Trưa, Quét Sỉ Lẻ Khuya..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                Chuỗi Hành Động (Trình tự chạy)
                                <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-xs">{tasks.length} Bước</span>
                            </h4>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
                                <p className="text-slate-500 text-sm">Chưa có hành động nào. Vui lòng thêm phân đoạn mới.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tasks.map((task, idx) => (
                                    <div key={task.id} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 p-4 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-sm transition-all group relative overflow-hidden">
                                        {/* Step Number Ribbon */}
                                        <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-br-lg">
                                            Bước {idx + 1}
                                        </div>

                                        <div className="flex flex-col gap-1 mt-4 sm:mt-0 shrink-0">
                                            <button disabled={idx === 0} onClick={() => moveTask(idx, 'up')} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400"><ArrowUp className="w-4 h-4"/></button>
                                            <button disabled={idx === tasks.length - 1} onClick={() => moveTask(idx, 'down')} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400"><ArrowDown className="w-4 h-4"/></button>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 sm:mt-0">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Loại Lệnh Động Mạch</label>
                                                <select 
                                                    value={task.script_name}
                                                    onChange={e => handleUpdateTask(task.id, 'script_name', e.target.value)}
                                                    className="w-full text-sm p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                                                >
                                                    {availableScripts.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Tham số / Biến số (Tùy chọn)</label>
                                                <input 
                                                    type="text" 
                                                    value={task.args}
                                                    onChange={e => handleUpdateTask(task.id, 'args', e.target.value)}
                                                    placeholder={task.script_name.includes('search') ? 'Bản Lề, Tạp hóa...' : task.script_name.includes('invite') ? '50 (Số người)' : 'Bỏ trống để Mặc định'}
                                                    className="w-full text-sm p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <button onClick={() => handleRemoveTask(task.id)} className="text-red-400 hover:text-red-600 p-2 sm:mt-4 self-end sm:self-auto shrink-0 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button 
                            onClick={handleAddTask}
                            className="w-full py-4 border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
                        >
                            <Plus className="w-5 h-5" /> Thêm Bước Tiết Diện
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 rounded-b-xl shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
                    >
                        {isSaving ? "Đang đúc khuôn..." : "Lưu Phôi Chiến Dịch"}
                        {!isSaving && <Save className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
