"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Loader2, Plus, ClipboardList, DollarSign, PenSquare, Trash2, CheckSquare } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabaseClient";

interface SetupTask {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    order_index: number;
}

interface SetupExpense {
    id: string;
    item_name: string;
    category: string;
    amount_expected: number;
    amount_actual: number;
    status: string;
}

const supabase = createClient();

export default function FactorySetupPage() {
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<'kanban' | 'budget'>('kanban');

    // AI Dialog State
    const [showAIDialog, setShowAIDialog] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiInput, setAiInput] = useState({
        industry: "Thực phẩm",
        area: "60",
        budget: "50000000"
    });

    // Data State
    const [tasks, setTasks] = useState<SetupTask[]>([]);
    const [expenses, setExpenses] = useState<SetupExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [{ data: tasksData }, { data: expData }] = await Promise.all([
                supabase.from('factory_setup_tasks').select('*').order('order_index', { ascending: true }),
                supabase.from('factory_setup_expenses').select('*').order('created_at', { ascending: false })
            ]);
            setTasks(tasksData || []);
            setExpenses(expData || []);
        } catch (e) {
            console.error("Failed to load factory setup data", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/ai/factory-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiInput)
            });
            const data = await res.json();
            if (data.success) {
                alert("Đã tạo kế hoạch thành công!");
                setShowAIDialog(false);
                loadData();
            } else {
                alert("Lỗi AI: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối máy chủ AI");
        } finally {
            setIsGenerating(false);
        }
    };

    const updateTaskStatus = async (id: string, newStatus: string) => {
        const oldTasks = [...tasks];
        setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
        const { error } = await supabase.from('factory_setup_tasks').update({ status: newStatus }).eq('id', id);
        if (error) {
            alert("Lỗi cập nhật trạng thái");
            setTasks(oldTasks);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const KANBAN_STAGES = [
        { id: 'todo', title: 'Cần làm / Gợi ý' },
        { id: 'looking_for_vendor', title: 'Đang tìm thợ/báo giá' },
        { id: 'doing', title: 'Đang thi công' },
        { id: 'done', title: 'Nghiệm thu' }
    ];

    const totalBudget = expenses.reduce((sum, e) => sum + Number(e.amount_expected), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount_actual), 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* H E A D E R */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-600 p-2 rounded-xl">
                            <PenSquare className="w-6 h-6" />
                        </span>
                        Dự án Setup Xưởng Mới
                    </h1>
                    <p className="text-slate-600 mt-1">Quản lý tiến độ thi công, sắm sửa và chi phí thiết lập xưởng.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAIDialog(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
                    >
                        <Sparkles className="w-4 h-4" />
                        Nhờ AI Lên Kế Hoạch
                    </button>
                </div>
            </div>

            {/* T A B S */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('kanban')}
                    className={`pb-3 px-2 font-bold transition-all ${activeTab === 'kanban' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Kế hoạch & Tiến độ</div>
                </button>
                <button
                    onClick={() => setActiveTab('budget')}
                    className={`pb-3 px-2 font-bold transition-all ${activeTab === 'budget' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Chi phí & Ngân sách</div>
                </button>
            </div>

            {/* C O N T E N T */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : (
                <>
                    {/* KANBAN BOARD */}
                    {activeTab === 'kanban' && (
                        <div className="flex gap-4 overflow-x-auto pb-6">
                            {KANBAN_STAGES.map(stage => (
                                <div key={stage.id} className="flex-1 min-w-[300px] bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 flex flex-col max-h-[70vh]">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-800">{stage.title}</h3>
                                        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full font-bold">
                                            {tasks.filter(t => t.status === stage.id).length}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                        {tasks.filter(t => t.status === stage.id).map(task => (
                                            <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-all cursor-grab group">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-semibold text-slate-900 text-sm leading-tight">{task.title}</h4>
                                                    {task.priority === 'high' && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0">Gấp</span>}
                                                </div>
                                                {task.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{task.description}</p>}
                                                
                                                <div className="mt-3 flex justify-end">
                                                    <select 
                                                        className="text-xs border-slate-200 rounded-lg p-1 bg-slate-50 text-slate-600 cursor-pointer outline-none"
                                                        value={task.status}
                                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                    >
                                                        {KANBAN_STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* BUDGET TAB */}
                    {activeTab === 'budget' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                                    <div className="text-emerald-600 text-sm font-bold mb-1">Tổng dự toán (Kế hoạch)</div>
                                    <div className="text-3xl font-black text-slate-900">{formatCurrency(totalBudget)}</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                                    <div className="text-orange-600 text-sm font-bold mb-1">Đã chi / Đã cọc thực tế</div>
                                    <div className="text-3xl font-black text-slate-900">{formatCurrency(totalSpent)}</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="text-slate-500 text-sm font-bold mb-1">Chênh lệch</div>
                                    <div className="text-3xl font-black text-slate-900">{formatCurrency(totalBudget - totalSpent)}</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Hạng mục chi phí</th>
                                            <th className="px-6 py-4 font-bold">Dự toán</th>
                                            <th className="px-6 py-4 font-bold">Số tiền thực chi</th>
                                            <th className="px-6 py-4 font-bold">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {expenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-800">{exp.item_name}</td>
                                                <td className="px-6 py-4 font-semibold text-slate-600">{formatCurrency(exp.amount_expected)}</td>
                                                <td className="px-6 py-4 font-bold text-orange-600">{formatCurrency(exp.amount_actual)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-bold
                                                        ${exp.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                                                    `}>{exp.status === 'paid' ? 'Đã Thanh Toán' : 'Dự kiến'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {expenses.length === 0 && (
                                            <tr><td colSpan={4} className="text-center py-8 text-slate-400">Chưa có hạng mục chi phí nào</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* AI DIALOG */}
            {showAIDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl border border-slate-200/50">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    AI Lập Kế Hoạch Setup
                                </h3>
                                <button onClick={() => setShowAIDialog(false)} className="text-slate-400 hover:text-slate-600 p-2"><XIcon /></button>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">Khai báo thông tin xưởng mộc/thực phẩm/thời trang của bạn để AI có thể rải đầu việc thực tế nhất.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Ngành nghề/Sản phẩm đóng gói *</label>
                                <input type="text" className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium" 
                                    value={aiInput.industry} onChange={e => setAiInput({...aiInput, industry: e.target.value})} placeholder="Vd: Thực phẩm sấy khô, Mỹ phẩm..." />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Diện tích (m2) *</label>
                                    <input type="number" className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 font-medium" 
                                        value={aiInput.area} onChange={e => setAiInput({...aiInput, area: e.target.value})} placeholder="60" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Ngân sách dự kiến (VND) *</label>
                                    <input type="number" className="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 font-medium" 
                                        value={aiInput.budget} onChange={e => setAiInput({...aiInput, budget: e.target.value})} placeholder="50000000" />
                                </div>
                            </div>

                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowAIDialog(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">Hủy</button>
                            <button onClick={handleGenerateAI} disabled={isGenerating} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isGenerating ? "AI Đang rải việc (10s)..." : "Bắt đầu sinh kế hoạch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function XIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    )
}
