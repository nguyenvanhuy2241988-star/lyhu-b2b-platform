"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { Sparkles, Loader2, Plus, ClipboardList, DollarSign, PenSquare, Trash2, CheckSquare, Send, Bot, User, Wrench, FileText, Cpu, Users, Home, Zap, MoreHorizontal, Pencil, Save, X, ChevronDown, ChevronUp, AlignLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabaseClient";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    description?: string;
    created_at?: string;
    updated_at?: string;
}

interface ChatMessage {
    id?: string;
    role: 'user' | 'ai';
    content: string;
    created_at?: string;
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

    // Edit State
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<SetupExpense>>({});
    const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatting, setIsChatting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages, isChatting]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [{ data: tasksData }, { data: expData }, { data: chatData }] = await Promise.all([
                supabase.from('factory_setup_tasks').select('*').order('order_index', { ascending: true }),
                supabase.from('factory_setup_expenses').select('*').order('created_at', { ascending: false }),
                supabase.from('factory_setup_ai_chats').select('*').order('created_at', { ascending: true })
            ]);
            setTasks(tasksData || []);
            setExpenses(expData || []);
            setChatMessages(chatData || []);
        } catch (e) {
            console.error("Failed to load factory setup data", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (session) {
            loadData();
        }
    }, [loadData, session]);

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

    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !session?.user?.id) return;

        const newMessage: ChatMessage = { role: 'user', content: chatInput };
        setChatMessages(prev => [...prev, newMessage]);
        setChatInput("");
        setIsChatting(true);

        try {
            const res = await fetch('/api/ai/factory-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMessage.content,
                    userId: session.user.id,
                    history: chatMessages
                })
            });
            
            const data = await res.json();
            if (data.success) {
                setChatMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
            } else {
                console.error("Chat error:", data.error);
                setChatMessages(prev => [...prev, { role: 'ai', content: "Xin lỗi, đã có lỗi kết nối tới AI. Vui lòng thử lại!" }]);
            }
        } catch (error) {
            console.error("Chat request failed:", error);
            setChatMessages(prev => [...prev, { role: 'ai', content: "Hệ thống AI đang bận, vui lòng thử lại sau!" }]);
        } finally {
            setIsChatting(false);
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

    // TỐI GIẢN & MÀU BRAND LYHU (TEAL / SLATE)
    const getCategoryConfig = (cat: string) => {
        // Màu cơ bản chung cho tất cả để đảm bảo sự tối giản thống nhất
        const defaultStyle = { bg: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-white border text-teal-600 border-teal-100 shadow-sm' };
        
        switch (cat) {
            case 'hardware': return { label: 'Vật tư & Phần cứng', icon: <Wrench className="w-3.5 h-3.5" />, ...defaultStyle };
            case 'legal': return { label: 'Thủ tục & Pháp lý', icon: <FileText className="w-3.5 h-3.5" />, ...defaultStyle };
            case 'machines': return { label: 'Máy móc thiết bị', icon: <Cpu className="w-3.5 h-3.5" />, ...defaultStyle };
            case 'labor': return { label: 'Nhân công', icon: <Users className="w-3.5 h-3.5" />, ...defaultStyle };
            case 'rent': return { label: 'Mặt bằng', icon: <Home className="w-3.5 h-3.5" />, ...defaultStyle };
            case 'electricity': return { label: 'Điện & Nước', icon: <Zap className="w-3.5 h-3.5" />, ...defaultStyle };
            default: return { label: cat && cat !== 'other' ? cat : 'Chi phí khác', icon: <MoreHorizontal className="w-3.5 h-3.5" />, ...defaultStyle };
        }
    }

    const handleEditExpense = (exp: SetupExpense) => {
        setEditingExpenseId(exp.id);
        setEditForm(exp);
        setExpandedExpenseId(exp.id); 
    };

    const handleAddNewExpense = (categoryName: string) => {
        const newId = `new_${Date.now()}`;
        const newExp: SetupExpense = {
            id: newId,
            item_name: "",
            category: categoryName,
            amount_expected: 0,
            amount_actual: 0,
            status: "pending",
            description: ""
        };
        // Thêm vào đầu list để render ra liền
        setExpenses([newExp, ...expenses]);
        setEditingExpenseId(newId);
        setEditForm(newExp);
        setExpandedExpenseId(newId);
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn hạng mục dự toán này không? Hệ thống không thể phục hồi.")) return;
        
        // Optimistic delete
        setExpenses(expenses.filter(e => e.id !== id));
        if (id.startsWith('new_')) return; // Just local state, discard
        
        const { error } = await supabase.from('factory_setup_expenses').delete().eq('id', id);
        if (error) {
            alert("Lỗi khi xóa: " + error.message);
            loadData(); // Reload to restore
        }
    };

    const handleSaveExpense = async () => {
        if (!editingExpenseId) return;
        
        const isNew = editingExpenseId.startsWith('new_');
        const targetId = editingExpenseId;
        
        const dataToSave = { ...editForm } as Partial<SetupExpense>;
        if (isNew) {
            delete dataToSave.id;
        } else {
            delete dataToSave.id;
            delete dataToSave.created_at;
            delete dataToSave.updated_at;
        }

        // Optimistic Update
        const updatedExpenses = expenses.map(e => e.id === targetId ? { ...e, ...editForm } as SetupExpense : e);
        setExpenses(updatedExpenses);
        setEditingExpenseId(null);
        
        if (isNew) {
            const { data, error } = await supabase.from('factory_setup_expenses').insert(dataToSave).select().single();
            if (error) {
                alert("Lỗi khi tạo mới hạng mục: " + error.message);
                setExpenses(expenses.filter(e => e.id !== targetId)); // Rollback
            } else if (data) {
                setExpenses(prev => prev.map(e => e.id === targetId ? data : e)); // Update with real ID
            }
        } else {
            const { error } = await supabase.from('factory_setup_expenses').update(dataToSave).eq('id', targetId);
            if (error) {
                alert("Lỗi khi lưu: " + error.message);
                loadData();
            }
        }
    };

    // Chuẩn bị Grouping
    const groupedExpenses = expenses.reduce((acc, curr) => {
        const cat = curr.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(curr);
        return acc;
    }, {} as Record<string, SetupExpense[]>);

    const KANBAN_STAGES = [
        { id: 'todo', title: 'Cần làm / Gợi ý' },
        { id: 'looking_for_vendor', title: 'Đang tìm thợ/báo giá' },
        { id: 'doing', title: 'Đang thi công' },
        { id: 'done', title: 'Nghiệm thu' }
    ];

    const totalBudget = expenses.reduce((sum, e) => sum + Number(e.amount_expected), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount_actual), 0);

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto h-[var(--main-height,calc(100vh-6rem))]">
            
            {/* LEFT COLUMN: MAIN CONTENT (70%) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto space-y-6 lg:pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                {/* H E A D E R */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-teal-100 text-teal-700 p-2 rounded-xl">
                                <PenSquare className="w-6 h-6" />
                            </span>
                            Dự án Setup Xưởng Mới
                        </h1>
                        <p className="text-slate-600 mt-1">Quản lý toàn diện tiến độ thi công, sắm sửa và chi phí thiết lập đầu tư.</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setShowAIDialog(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            Lên Kế Hoạch Bằng AI
                        </button>
                    </div>
                </div>

                {/* T A B S */}
                <div className="flex gap-4 border-b border-slate-200 shrink-0">
                    <button
                        onClick={() => setActiveTab('kanban')}
                        className={`pb-3 px-3 font-bold transition-all ${activeTab === 'kanban' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Kế hoạch Công Việc</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('budget')}
                        className={`pb-3 px-3 font-bold transition-all ${activeTab === 'budget' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Ngân Sách Dự Toán</div>
                    </button>
                </div>

                {/* C O N T E N T */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64 shrink-0">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                ) : (
                    <div className="flex-1 pb-6">
                        {/* KANBAN BOARD */}
                        {activeTab === 'kanban' && (
                            <div className="flex gap-6 overflow-x-auto h-[calc(100vh-14rem)] xl:h-auto items-start pb-4">
                                {KANBAN_STAGES.map(stage => (
                                    <div key={stage.id} className="flex-1 min-w-[320px] w-[320px] bg-slate-50 rounded-2xl p-4 flex flex-col h-full xl:max-h-[75vh]">
                                        <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                                            <h3 className="font-bold text-slate-800 tracking-tight">{stage.title}</h3>
                                            <span className="bg-white border border-slate-200 text-slate-600 shadow-sm text-xs px-2 py-1.5 min-w-[28px] text-center rounded-lg font-bold">
                                                {tasks.filter(t => t.status === stage.id).length}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 scrollbar-thin scrollbar-thumb-slate-200">
                                            {tasks.filter(t => t.status === stage.id).map(task => (
                                                <div key={task.id} className="bg-white p-4 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-teal-300 transition-all cursor-grab group relative">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className="font-semibold text-slate-900 text-sm leading-snug">{task.title}</h4>
                                                        {task.priority === 'high' && <span className="bg-red-50 border border-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Gấp</span>}
                                                    </div>
                                                    {task.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{task.description}</p>}
                                                    
                                                    <div className="mt-4 flex justify-end">
                                                        <select 
                                                            className="text-xs border-slate-200 rounded-lg p-1.5 text-slate-600 hover:bg-slate-50 focus:ring-2 focus:ring-teal-500 cursor-pointer outline-none transition-colors font-medium"
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
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-200"></div>
                                        <div className="text-slate-500 text-sm font-bold mb-1 tracking-wide">TỔNG DỰ TOÁN</div>
                                        <div className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalBudget)}</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                                        <div className="text-orange-600 text-sm font-bold mb-1 tracking-wide">ĐÃ CHI / ĐẶT CỌC</div>
                                        <div className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalSpent)}</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                                        <div className="text-teal-600 text-sm font-bold mb-1 tracking-wide">CHÊNH LỆCH</div>
                                        <div className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalBudget - totalSpent)}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center px-1">
                                    <h3 className="font-bold text-slate-800">Chi Tiết Hạng Mục</h3>
                                    <button 
                                        onClick={() => handleAddNewExpense('other')}
                                        className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Khởi tạo chi phí mới
                                    </button>
                                </div>

                                <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50/80 text-xs uppercase text-slate-400 border-b border-slate-200 tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 font-bold">Hạng mục chi phí</th>
                                                <th className="px-6 py-4 font-bold">Dự toán dự kiến</th>
                                                <th className="px-6 py-4 font-bold">Số tiền thực chi</th>
                                                <th className="px-6 py-4 font-bold w-36">Trạng thái</th>
                                                <th className="px-4 py-4 font-bold w-20 text-center"><AlignLeft className="w-4 h-4 opacity-40 mx-auto" /></th>
                                            </tr>
                                        </thead>
                                        {Object.entries(groupedExpenses).map(([category, items]) => {
                                            const catConf = getCategoryConfig(category);
                                            return (
                                                <tbody key={category} className="divide-y divide-slate-50">
                                                    {/* Nhóm Hạng Mục - Minimalist Header */}
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan={5} className="px-6 py-3 font-semibold text-slate-800">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${catConf.iconBg}`}>
                                                                    {catConf.icon}
                                                                </div>
                                                                <span className="text-sm tracking-tight">{catConf.label}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    
                                                    {/* Các Hạng Mục Trong Nhóm */}
                                                    {items.map((exp) => {
                                                        const isEditing = editingExpenseId === exp.id;
                                                        const isExpanded = expandedExpenseId === exp.id;
                                                        
                                                        return (
                                                        <Fragment key={exp.id}>
                                                            <tr className={`transition-all duration-200 ${isEditing ? 'bg-teal-50/30' : 'hover:bg-slate-50/80'}`}>
                                                                <td className="px-6 py-4">
                                                                    {isEditing ? (
                                                                        <div className="space-y-2">
                                                                            <input 
                                                                                type="text" 
                                                                                className="w-full border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm transition-shadow outline-none"
                                                                                value={editForm.item_name || ''}
                                                                                onChange={(e) => setEditForm({...editForm, item_name: e.target.value})}
                                                                                placeholder="Tên hạng mục..."
                                                                            />
                                                                            <div className="flex gap-2 items-center text-xs">
                                                                                <span className="font-medium text-slate-400">Đổi rổ danh mục:</span>
                                                                                <input 
                                                                                    type="text" 
                                                                                    className="w-[140px] border-slate-200 rounded-md p-1.5 text-xs text-slate-600 focus:ring-2 focus:ring-teal-500 outline-none"
                                                                                    value={editForm.category || ''}
                                                                                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                                                                    placeholder="hardware, rent..."
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="font-bold text-slate-800 cursor-pointer hover:text-teal-600 transition-colors"
                                                                             onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}>
                                                                            {exp.item_name}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {isEditing ? (
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full max-w-[130px] border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                                                                            value={editForm.amount_expected || 0}
                                                                            onChange={(e) => setEditForm({...editForm, amount_expected: Number(e.target.value)})}
                                                                        />
                                                                    ) : (
                                                                        <span className="font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md">{formatCurrency(exp.amount_expected)}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {isEditing ? (
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full max-w-[130px] border-orange-200 bg-orange-50/50 rounded-lg p-2.5 text-sm font-bold text-orange-700 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
                                                                            value={editForm.amount_actual || 0}
                                                                            onChange={(e) => setEditForm({...editForm, amount_actual: Number(e.target.value)})}
                                                                        />
                                                                    ) : (
                                                                        <span className="font-black text-orange-600">{formatCurrency(exp.amount_actual)}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {isEditing ? (
                                                                        <select 
                                                                            className="w-full border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                                                                            value={editForm.status || 'pending'}
                                                                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                                                        >
                                                                            <option value="pending">Dự kiến</option>
                                                                            <option value="deposit">Đã Đặt Cọc</option>
                                                                            <option value="paid">Đã Thanh Toán</option>
                                                                        </select>
                                                                    ) : (
                                                                        <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider rounded font-bold
                                                                            ${exp.status === 'paid' ? 'bg-teal-100/50 text-teal-700 border border-teal-200' : 
                                                                              exp.status === 'deposit' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-100/80 text-slate-500'}
                                                                        `}>{exp.status === 'paid' ? 'Hoàn Tất' : exp.status === 'deposit' ? 'Đã Cọc' : 'Dự kiến'}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-4 text-center">
                                                                    {isEditing ? (
                                                                        <div className="flex gap-1.5 justify-center">
                                                                            <button onClick={() => setEditingExpenseId(null)} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-100 transition-colors shadow-sm"><X className="w-4 h-4" /></button>
                                                                            <button onClick={handleSaveExpense} className="p-2 text-white bg-teal-600 rounded-lg border border-teal-700 hover:bg-teal-700 transition-colors shadow-sm"><Save className="w-4 h-4" /></button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{opacity: isExpanded ? 1 : undefined}}>
                                                                            <button onClick={() => handleEditExpense(exp)} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                                                                            <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 text-slate-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                                            <button onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>

                                                            {/* Hàng Chi tiết mở rộng (Accordion) */}
                                                            {isExpanded && (
                                                                <tr className="bg-slate-50/30 border-b border-t border-slate-100/50">
                                                                    <td colSpan={5} className="px-6 py-5">
                                                                        <div className="max-w-4xl">
                                                                            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 opacity-50" /> Chi tiết kỹ thuật & Ghi chú</div>
                                                                            {isEditing ? (
                                                                                <textarea 
                                                                                    className="w-full min-h-[100px] border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 outline-none shadow-sm transition-shadow"
                                                                                    value={editForm.description || ''}
                                                                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                                                                    placeholder="Nhập thông số kĩ thuật máy móc, diện tích thi công phòng ốc, điều khoản đặt cọc hợp đồng, link đính kèm..."
                                                                                />
                                                                            ) : (
                                                                                <div className="text-sm font-medium leading-relaxed text-slate-600 bg-white p-4 rounded-xl border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] whitespace-pre-wrap">
                                                                                    {exp.description ? exp.description : <span className="italic text-slate-400 font-normal">Chưa có thông tin ghi chú chi tiết cho hạng mục này. Bấm vào biểu tượng cây bút để thêm thông tin.</span>}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
                                                        );
                                                    })}

                                                    {/* Row: Add new item to this specific category */}
                                                    <tr className="bg-white">
                                                        <td colSpan={5} className="px-6 py-2 border-b border-slate-100 border-dashed">
                                                            <button 
                                                                onClick={() => handleAddNewExpense(category)} 
                                                                className="text-[13px] font-bold text-teal-600/70 hover:text-teal-600 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-teal-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:opacity-100" 
                                                                style={{opacity: items.length === 0 ? 1 : undefined}} // Giữ cho nó hiện nếu nhóm trống, còn lại hiện khi hover để tối giản
                                                            >
                                                                <Plus className="w-3.5 h-3.5"/> Thêm hạng mục
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            );
                                        })}
                                        {expenses.length === 0 && (
                                            <tbody>
                                                <tr><td colSpan={5} className="text-center py-12">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <DollarSign className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-400 font-medium">Bạn chưa khởi tạo bảng dự toán nào.</p>
                                                    <button onClick={() => handleAddNewExpense('hardware')} className="bg-white border border-slate-200 shadow-sm text-slate-600 font-bold text-sm px-4 py-2 rounded-lg mt-4 hover:bg-slate-50 transition-colors">Tạo ngay dòng đầu tiên</button>    
                                                </td></tr>
                                            </tbody>
                                        )}
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: AI CHAT (30%) */}
            <div className="w-full lg:w-[420px] shrink-0 bg-white border border-slate-200 rounded-3xl flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-[600px] lg:h-full overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 relative overflow-hidden">
                    {/* Minimalist Pattern background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-70"></div>
                    
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 leading-tight">Chuyên gia AI</h3>
                            <p className="text-xs text-teal-600 font-bold mt-0.5 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span> Sẵn sàng tư vấn</p>
                        </div>
                    </div>
                </div>
                
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-slate-200">
                    {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-4 opacity-70">
                            <Bot className="w-12 h-12 text-teal-300" />
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Xin chào! Tôi là AI Kiến trúc sư. Bạn cần tư vấn công thức làm phòng vô trùng, hay giá cả làm vách ngăn Panel?
                            </p>
                        </div>
                    ) : (
                        chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm mt-1
                                    ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-teal-600 text-white shadow-teal-600/20'}
                                `}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[13px] 
                                    ${msg.role === 'user' 
                                        ? 'bg-slate-800 text-white rounded-tr-sm whitespace-pre-wrap leading-relaxed shadow-sm' 
                                        : 'bg-white border border-slate-200/70 text-slate-700 rounded-tl-sm shadow-sm'
                                    }
                                `}>
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <div className="markdown-content">
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed font-medium" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1.5 text-slate-600" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1.5 text-slate-600" {...props} />,
                                                    li: ({node, ...props}) => <li className="" {...props} />,
                                                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900 bg-teal-50 px-1 rounded-sm" {...props} />,
                                                    table: ({node, ...props}) => <div className="overflow-x-auto mb-4 mt-2 rounded-xl border border-slate-200/80 shadow-sm"><table className="min-w-full text-xs text-left border-collapse bg-white" {...props} /></div>,
                                                    th: ({node, ...props}) => <th className="border-b border-slate-200 font-bold p-3 bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px]" {...props} />,
                                                    td: ({node, ...props}) => <td className="border-b border-slate-100 p-3 text-slate-600 font-medium" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isChatting && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-teal-600 text-white shadow-sm mt-1">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"></div>
                                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="p-5 bg-white border-t border-slate-100 shrink-0">
                    <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-[20px] p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-400 transition-all shadow-inner focus-within:shadow-[0_4px_20px_rgba(20,184,166,0.08)]">
                        <textarea 
                            className="flex-1 max-h-32 min-h-12 bg-transparent border-none focus:ring-0 resize-none px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 font-medium"
                            placeholder="Mời bạn nhập câu hỏi thiết kế & giá cả..."
                            rows={1}
                            value={chatInput}
                            onChange={(e) => {
                                setChatInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendChat(e);
                                }
                            }}
                        />
                        <button 
                            type="submit" 
                            disabled={!chatInput.trim() || isChatting}
                            className="w-12 h-12 shrink-0 rounded-[14px] bg-teal-600 hover:bg-teal-700 hover:-translate-y-0.5 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:translate-y-0 shadow-sm"
                        >
                            <Send className="w-5 h-5 ml-1" />
                        </button>
                    </div>
                </form>
            </div>

            {/* AI DIALOG - MODAL */}
            {showAIDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm shadow-2xl">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl border border-slate-200/50">
                        <div className="p-6 border-b border-slate-100 bg-teal-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-teal-950 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-teal-600" />
                                    AI Lập Kế Hoạch Tự Động
                                </h3>
                                <button onClick={() => setShowAIDialog(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 border border-slate-200 rounded-lg hover:shadow-sm transition-all"><XIcon /></button>
                            </div>
                            <p className="text-sm font-medium text-teal-800/70 mt-3 leading-relaxed">Hệ thống AI sẽ quét dữ liệu thị trường và thiết lập sẵn cho bạn một bảng Tích hợp (Việc cần làm + Ngân sách tham khảo) để bắt đầu khởi nghiệp.</p>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-2">Ngành nghề/Sản phẩm cốt lõi *</label>
                                <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-bold text-slate-800 transition-all outline-none" 
                                    value={aiInput.industry} onChange={e => setAiInput({...aiInput, industry: e.target.value})} placeholder="Vd: Chế biến thịt đông lạnh, Trà Olong..." />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-2">Diện tích sàn (m2) *</label>
                                    <input type="number" className="w-full border-slate-200 bg-slate-50 rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-teal-500 font-bold text-slate-800 transition-all outline-none" 
                                        value={aiInput.area} onChange={e => setAiInput({...aiInput, area: e.target.value})} placeholder="60" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-2">Trần Ngân Sách (VND) *</label>
                                    <input type="number" className="w-full border-slate-200 bg-slate-50 rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-teal-500 font-bold text-slate-800 transition-all outline-none" 
                                        value={aiInput.budget} onChange={e => setAiInput({...aiInput, budget: e.target.value})} placeholder="50000000" />
                                </div>
                            </div>
                        </div>
                        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
                            <button onClick={() => setShowAIDialog(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-colors">Để sau</button>
                            <button onClick={handleGenerateAI} disabled={isGenerating} className="flex items-center gap-2 bg-teal-600 text-white px-7 py-3 rounded-xl font-bold hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-600/30 transition-all disabled:opacity-50">
                                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isGenerating ? "Hệ thống AI đang xử lý (~15s)..." : "Bắt đầu sinh dữ liệu"}
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    )
}
