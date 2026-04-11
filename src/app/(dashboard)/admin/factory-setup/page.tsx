"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Loader2, Plus, ClipboardList, DollarSign, PenSquare, Trash2, CheckSquare, Send, Bot, User } from "lucide-react";
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
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto space-y-6 lg:pr-2">
                {/* H E A D E R */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-600 p-2 rounded-xl">
                                <PenSquare className="w-6 h-6" />
                            </span>
                            Dự án Setup Xưởng Mới
                        </h1>
                        <p className="text-slate-600 mt-1">Quản lý tiến độ thi công, sắm sửa và chi phí thiết lập xưởng.</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setShowAIDialog(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            Tạo Kế Hoạch Bằng AI
                        </button>
                    </div>
                </div>

                {/* T A B S */}
                <div className="flex gap-4 border-b border-slate-200 shrink-0">
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
                    <div className="flex justify-center items-center h-64 shrink-0">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="flex-1 pb-6">
                        {/* KANBAN BOARD */}
                        {activeTab === 'kanban' && (
                            <div className="flex gap-4 overflow-x-auto h-[calc(100vh-14rem)] xl:h-auto items-start pb-4">
                                {KANBAN_STAGES.map(stage => (
                                    <div key={stage.id} className="flex-1 min-w-[300px] w-[300px] bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 flex flex-col h-full xl:max-h-[70vh]">
                                        <div className="flex justify-between items-center mb-4 shrink-0">
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
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: AI CHAT (30%) */}
            <div className="w-full lg:w-[400px] shrink-0 bg-white border border-slate-200 rounded-3xl flex flex-col shadow-sm h-[600px] lg:h-full overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 leading-tight">Chuyên gia Setup AI</h3>
                            <p className="text-xs text-indigo-600 font-semibold">Trực tuyến - Sẵn sàng tư vấn</p>
                        </div>
                    </div>
                </div>
                
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 flex flex-col gap-4">
                    {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-4 opacity-70">
                            <Bot className="w-12 h-12 text-indigo-300" />
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Xin chào! Tôi là AI Chuyên gia về Setup Nhà Xưởng. Bạn cần tư vấn về chi phí thi công nền, điện nước hay cách xin giấy VSATTP?
                            </p>
                        </div>
                    ) : (
                        chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm mt-1
                                    ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}
                                `}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm 
                                    ${msg.role === 'user' 
                                        ? 'bg-slate-800 text-white rounded-tr-sm whitespace-pre-wrap' 
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                                    }
                                `}>
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <div className="markdown-content">
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                                                    li: ({node, ...props}) => <li className="" {...props} />,
                                                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                                                    table: ({node, ...props}) => <div className="overflow-x-auto mb-3 mt-1 rounded-lg border border-slate-200"><table className="min-w-full text-xs text-left border-collapse" {...props} /></div>,
                                                    th: ({node, ...props}) => <th className="border-b border-slate-200 font-bold p-2 bg-slate-50 text-slate-800" {...props} />,
                                                    td: ({node, ...props}) => <td className="border-b border-slate-100 p-2 text-slate-600" {...props} />
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
                            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm mt-1">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-slate-100 shrink-0">
                    <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                        <textarea 
                            className="flex-1 max-h-32 min-h-10 bg-transparent border-none focus:ring-0 resize-none px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 font-medium"
                            placeholder="Nhập câu hỏi tư vấn..."
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
                            className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>

            {/* AI DIALOG - MODAL */}
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
                            <p className="text-sm text-slate-600 mt-2">Khai báo thông tin xưởng của bạn để AI có thể tự động rải đầu việc thiết kế bảng Kanban thực tế nhất.</p>
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
                                {isGenerating ? "AI Đang xử lý (10s)..." : "Bắt đầu khởi tạo"}
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
