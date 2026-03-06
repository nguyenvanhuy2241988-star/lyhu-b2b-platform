'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    fetchChatbotRules,
    createChatbotRule,
    updateChatbotRule,
    deleteChatbotRule,
    ChatbotRule,
    updateMessengerProfile,
    fetchFacebookPages
} from '@/lib/marketingStore';
import { Plus, Trash2, Edit, Zap, X, Save, Search, Bot, MessageSquare, EyeOff, Shield, Eye, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationPage() {
    const { user, session } = useAuth();
    const token = session?.access_token;
    const [rules, setRules] = useState<ChatbotRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Tabs State
    const [activeTab, setActiveTab] = useState<'rules' | 'settings' | 'comments'>('rules');

    // Comments Management State
    const [commentPosts, setCommentPosts] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [expandedPost, setExpandedPost] = useState<string | null>(null);

    // Settings State
    const [greetingText, setGreetingText] = useState('');
    const [autoHidePhone, setAutoHidePhone] = useState(false);
    const [autoHideAll, setAutoHideAll] = useState(false);
    const [autoHideKeywords, setAutoHideKeywords] = useState('');
    const [autoReplyComment, setAutoReplyComment] = useState(false);
    const [autoReplyCommentText, setAutoReplyCommentText] = useState('');
    const [persistentMenu, setPersistentMenu] = useState<any[]>([]);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [pages, setPages] = useState<any[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<ChatbotRule | null>(null);
    const [formData, setFormData] = useState<Partial<ChatbotRule> & { reply_method?: string, apply_to?: string, auto_hide?: boolean }>({
        keyword: '',
        match_type: 'contains',
        response_text: '',
        response_type: 'text',
        media_url: '',
        is_active: true,
        reply_method: 'comment',
        apply_to: 'comment',
        auto_hide: false
    });

    useEffect(() => {
        if (token) {
            loadRules();
            loadPages();
        }
    }, [token]);

    const loadRules = async () => {
        setLoading(true);
        const data = await fetchChatbotRules(token || undefined);
        setRules(data);
        setLoading(false);
    };

    const loadPages = async () => {
        const p = await fetchFacebookPages(token || undefined);
        setPages(p);
        if (p.length > 0) {
            setSelectedPageId(p[0].id);
            if (p[0].chatbot_config) {
                const config = p[0].chatbot_config as any;
                setGreetingText(config?.greeting_text || '');
                setAutoHidePhone(config?.auto_hide_phone || false);
                setAutoHideAll(config?.auto_hide_all || false);
                setAutoHideKeywords(config?.auto_hide_keywords || '');
                setAutoReplyComment(config?.auto_reply_comment || false);
                setAutoReplyCommentText(config?.auto_reply_comment_text || '');
                setPersistentMenu(config?.persistent_menu || []);
            }
        }
    };

    // When select changes, update local state
    useEffect(() => {
        if (selectedPageId && pages.length > 0) {
            const p = pages.find(page => page.id === selectedPageId);
            if (p) {
                const config = p.chatbot_config as any;
                setGreetingText(config?.greeting_text || '');
                setAutoHidePhone(config?.auto_hide_phone || false);
                setAutoHideAll(config?.auto_hide_all || false);
                setAutoHideKeywords(config?.auto_hide_keywords || '');
                setAutoReplyComment(config?.auto_reply_comment || false);
                setAutoReplyCommentText(config?.auto_reply_comment_text || '');
                setPersistentMenu(config?.persistent_menu || []);
            }
        }
    }, [selectedPageId]);

    const addMenuItem = () => {
        if (persistentMenu.length >= 3) return;
        setPersistentMenu([...persistentMenu, { type: 'web_url', title: '', url: '' }]);
    };

    const updateMenuItem = (index: number, updates: any) => {
        const newMenu = [...persistentMenu];
        newMenu[index] = { ...newMenu[index], ...updates };
        setPersistentMenu(newMenu);
    };

    const removeMenuItem = (index: number) => {
        setPersistentMenu(persistentMenu.filter((_, i) => i !== index));
    };

    const handleSaveSettings = async () => {
        if (!selectedPageId) return toast.error("Vui lòng chọn Fanpage");

        setIsSavingSettings(true);
        try {
            const page = pages.find(p => p.id === selectedPageId);
            if (!page || !page.access_token) throw new Error("Page Token not found");

            await updateMessengerProfile(page.page_id, page.access_token, {
                greeting_text: greetingText,
                auto_hide_phone: autoHidePhone,
                auto_hide_all: autoHideAll,
                auto_hide_keywords: autoHideKeywords,
                auto_reply_comment: autoReplyComment,
                auto_reply_comment_text: autoReplyCommentText,
                persistent_menu: persistentMenu,
            });

            // Optimistic update
            setPages(prev => prev.map(p => p.id === selectedPageId ? {
                ...p,
                chatbot_config: { ...p.chatbot_config, greeting_text: greetingText, auto_hide_phone: autoHidePhone, auto_hide_all: autoHideAll, auto_hide_keywords: autoHideKeywords, auto_reply_comment: autoReplyComment, auto_reply_comment_text: autoReplyCommentText, persistent_menu: persistentMenu }
            } : p));
            toast.success("Đã cập nhật cấu hình lên Facebook");
        } catch (error) {
            toast.error("Lỗi cập nhật configuration");
            console.error(error);
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleOpenModal = (rule?: ChatbotRule) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                keyword: rule.keyword,
                match_type: rule.match_type,
                response_text: rule.response_text,
                response_type: rule.response_type,
                media_url: rule.media_url,
                is_active: rule.is_active,
                reply_method: (rule as any).reply_method || 'comment',
                apply_to: (rule as any).apply_to || 'comment',
                auto_hide: (rule as any).auto_hide || false
            });
        } else {
            setEditingRule(null);
            setFormData({
                keyword: '',
                match_type: 'contains',
                response_text: '',
                response_type: 'text',
                media_url: '',
                is_active: true,
                reply_method: 'comment',
                apply_to: 'comment',
                auto_hide: false
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRule) {
                const success = await updateChatbotRule(editingRule.id, formData as any, token || undefined);
                if (success) toast.success('Cập nhật thành công');
                else throw new Error('Failed to update');
            } else {
                const newRule = await createChatbotRule(formData as any, token || undefined);
                if (newRule) toast.success('Thêm mới thành công');
                else throw new Error('Failed to create');
            }
            setIsModalOpen(false);
            loadRules(); // Reload
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa?')) return;
        const success = await deleteChatbotRule(id, token || undefined);
        if (success) {
            toast.success('Đã xóa quy tắc');
            setRules(rules.filter(r => r.id !== id));
        } else {
            toast.error('Không xóa được');
        }
    };

    const toggleStatus = async (rule: ChatbotRule) => {
        const newStatus = !rule.is_active;
        const success = await updateChatbotRule(rule.id, { is_active: newStatus }, token || undefined);
        if (success) {
            setRules(rules.map(r => r.id === rule.id ? { ...r, is_active: newStatus } : r));
            toast.success(`Đã ${newStatus ? 'bật' : 'tắt'} quy tắc`);
        }
    };

    const loadComments = async () => {
        if (!selectedPageId || pages.length === 0) {
            toast.error('Chọn Fanpage trước');
            return;
        }
        const page = pages.find(p => p.id === selectedPageId);
        if (!page) return;
        setLoadingComments(true);
        try {
            const res = await fetch('/api/facebook/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_id: page.page_id, access_token: page.access_token })
            });
            const data = await res.json();
            if (data.success) {
                setCommentPosts(data.posts || []);
                const adCount = (data.posts || []).filter((p: any) => p.is_ad).length;
                console.log('[Comments Debug]', data.debug);
                toast.success(`Tải ${data.posts?.length || 0} bài (${adCount} bài QC)`);
            } else {
                toast.error(data.error || 'Lỗi tải bình luận');
            }
        } catch (e: any) {
            toast.error('Lỗi: ' + e.message);
        } finally {
            setLoadingComments(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-500" />
                        Tự động hóa Chatbot
                    </h1>
                </div>
                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'rules' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Luật Từ khóa
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'settings' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Cấu hình chung
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('comments');
                            if (commentPosts.length === 0) loadComments();
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'comments' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Quản lý bình luận
                    </button>
                </div>
            </div>

            {activeTab === 'rules' ? (
                <>
                    <div className="flex justify-between items-center">
                        <p className="text-slate-500 text-sm">Quản lý các quy tắc trả lời tự động theo từ khóa</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm quy tắc
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm từ khóa..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Đang tải...</div>
                    ) : (
                        <div className="bg-white rounded-xl shadow border overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-medium text-slate-600 w-1/4">Từ khóa (Key)</th>
                                        <th className="p-4 font-medium text-slate-600 w-1/2">Phản hồi (Response)</th>
                                        <th className="p-4 font-medium text-slate-600 w-1/12 text-center">Khớp</th>
                                        <th className="p-4 font-medium text-slate-600 w-1/12 text-center">Trạng thái</th>
                                        <th className="p-4 font-medium text-slate-600 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.filter(r => (r.keyword + ' ' + (r.response_text || '')).toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-400">
                                                <Bot className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                Chưa có quy tắc nào
                                            </td>
                                        </tr>
                                    ) : rules.filter(r => (r.keyword + ' ' + (r.response_text || '')).toLowerCase().includes(search.toLowerCase())).map(rule => (
                                        <tr key={rule.id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="p-4 font-medium text-blue-700">"{rule.keyword}"</td>
                                            <td className="p-4 text-slate-700 truncate max-w-xs" title={rule.response_text}>
                                                {rule.response_type === 'image' ? '[Hình ảnh] ' + (rule.response_text || '') : rule.response_text}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-xs px-2 py-1 rounded-full ${rule.match_type === 'exact' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {rule.match_type === 'exact' ? 'Chính xác' : 'Chứa'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => toggleStatus(rule)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleOpenModal(rule)} className="p-2 hover:bg-slate-200 rounded text-slate-600 mr-2">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(rule.id)} className="p-2 hover:bg-red-100 rounded text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-xl shadow border p-8">
                    <h3 className="font-semibold text-lg mb-4">Cấu hình Messenger Profile</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Chọn Fanpage</label>
                        <select
                            className="w-full border rounded-lg p-2"
                            value={selectedPageId}
                            onChange={e => setSelectedPageId(e.target.value)}
                        >
                            {pages.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium mb-1">Lời chào (Greeting Text)</label>
                            <p className="text-xs text-slate-500 mb-2">Văn bản hiển thị khi khách hàng lần đầu mở chat (trước khi bấm Bắt đầu).</p>
                            <textarea
                                rows={3}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Xin chào {{user_full_name}}! Chúng tôi có thể giúp gì cho bạn?"
                                value={greetingText}
                                onChange={e => setGreetingText(e.target.value)}
                            />
                        </div>

                        <label className="block text-sm font-medium mb-1">Menu Chính (Persistent Menu)</label>
                        <p className="text-xs text-slate-500 mb-2">Menu cố định ở góc dưới khung chat. Tối đa 3 nút.</p>

                        <div className="space-y-2">
                            {persistentMenu.map((item, index) => (
                                <div key={index} className="flex gap-2 items-start bg-slate-50 p-2 rounded border">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            placeholder="Tên nút (VD: Website)"
                                            className="w-full text-sm border rounded px-2 py-1"
                                            value={item.title}
                                            onChange={e => updateMenuItem(index, { title: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <select
                                                className="text-sm border rounded px-2 py-1"
                                                value={item.type}
                                                onChange={e => updateMenuItem(index, { type: e.target.value as any })}
                                            >
                                                <option value="web_url">Mở Link (Web URL)</option>
                                                <option value="postback">Nút bấm (Postback)</option>
                                            </select>
                                            {item.type === 'web_url' ? (
                                                <input
                                                    placeholder="https://..."
                                                    className="flex-1 text-sm border rounded px-2 py-1"
                                                    value={item.url || ''}
                                                    onChange={e => updateMenuItem(index, { url: e.target.value })}
                                                />
                                            ) : (
                                                <input
                                                    placeholder="Payload (VD: CARE_HELP)"
                                                    className="flex-1 text-sm border rounded px-2 py-1"
                                                    value={item.payload || ''}
                                                    onChange={e => updateMenuItem(index, { payload: e.target.value })}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => removeMenuItem(index)} className="text-slate-400 hover:text-red-500 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {persistentMenu.length < 3 && (
                                <button
                                    onClick={addMenuItem}
                                    className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-blue-300 hover:text-blue-600 flex items-center justify-center gap-2 text-sm font-medium transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm nút Menu
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 space-y-4">
                        {/* Auto-Hide Phone */}
                        <div className="flex items-center gap-3 bg-red-50 p-4 rounded-lg border border-red-100">
                            <input
                                type="checkbox"
                                id="autoHide"
                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                checked={autoHidePhone}
                                onChange={e => setAutoHidePhone(e.target.checked)}
                            />
                            <div>
                                <label htmlFor="autoHide" className="font-medium text-slate-800 cursor-pointer select-none">
                                    🔒 Ẩn bình luận chứa Số điện thoại
                                </label>
                                <p className="text-xs text-red-500">Bình luận có 10 chữ số sẽ tự động bị ẩn đi để tránh cướp khách.</p>
                            </div>
                        </div>

                        {/* Auto-Hide by Keywords */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <div className="flex items-center gap-2 mb-2">
                                <EyeOff className="w-4 h-4 text-orange-600" />
                                <label className="font-medium text-slate-800">Ẩn bình luận chứa từ khóa</label>
                            </div>
                            <p className="text-xs text-orange-600 mb-2">Nhập các từ khóa cần ẩn, phân cách bằng dấu phẩy. VD: &quot;zalo, liên hệ, inbox&quot;</p>
                            <textarea
                                rows={2}
                                className="w-full border border-orange-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white"
                                placeholder="zalo, liên hệ, inbox, mua hàng..."
                                value={autoHideKeywords}
                                onChange={e => setAutoHideKeywords(e.target.value)}
                            />
                        </div>

                        {/* Auto-Reply to All Comments */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                                <input
                                    type="checkbox"
                                    id="autoReplyComment"
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                    checked={autoReplyComment}
                                    onChange={e => setAutoReplyComment(e.target.checked)}
                                />
                                <div>
                                    <label htmlFor="autoReplyComment" className="font-medium text-slate-800 cursor-pointer select-none">
                                        💬 Tự động trả lời TẤT CẢ bình luận
                                    </label>
                                    <p className="text-xs text-green-600">Tự động reply mỗi bình luận mới bằng nội dung bên dưới (ngoài các quy tắc từ khóa).</p>
                                </div>
                            </div>
                            {autoReplyComment && (
                                <textarea
                                    rows={3}
                                    className="w-full border border-green-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-400 outline-none bg-white mt-2"
                                    placeholder="Cảm ơn bạn đã quan tâm! Inbox để được tư vấn chi tiết nhé 🎉"
                                    value={autoReplyCommentText}
                                    onChange={e => setAutoReplyCommentText(e.target.value)}
                                />
                            )}
                        </div>

                        {/* Auto-Hide Comments on Ad Posts */}
                        <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <input
                                type="checkbox"
                                id="autoHideAll"
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                checked={autoHideAll}
                                onChange={e => setAutoHideAll(e.target.checked)}
                            />
                            <div>
                                <label htmlFor="autoHideAll" className="font-medium text-slate-800 cursor-pointer select-none">
                                    📢 Ẩn bình luận trên bài QUẢNG CÁO
                                </label>
                                <p className="text-xs text-purple-600">Tự động ẩn tất cả bình luận trên bài quảng cáo (promoted posts). Bài viết bình thường không bị ảnh hưởng.</p>
                            </div>
                        </div>

                        {/* Scan Old Comments */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 relative z-10">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium text-slate-800">🔄 Xử lý bình luận cũ</p>
                                    <p className="text-xs text-blue-600">Quét các bình luận cũ trên các bài viết và áp dụng quy tắc ẩn/trả lời tự động.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!selectedPageId) return toast.error('Chọn Fanpage trước');
                                        const page = pages.find(p => p.id === selectedPageId);
                                        if (!page) return;
                                        const btn = document.getElementById('scanBtn');
                                        if (btn) { btn.textContent = '⏳ Đang quét...'; btn.setAttribute('disabled', 'true'); }
                                        toast.info('Đang quét bình luận cũ...');
                                        try {
                                            const res = await fetch('/api/facebook/scan-comments', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ page_id: page.page_id, access_token: page.access_token, db_page_id: page.id })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                toast.success(`Đã xử lý ${data.processed} bình luận, ẩn ${data.hidden}, reply ${data.replied}`);
                                            } else {
                                                toast.error(data.error || 'Lỗi quét');
                                            }
                                        } catch (e: any) {
                                            toast.error('Lỗi: ' + e.message);
                                        } finally {
                                            if (btn) { btn.textContent = '🔍 Quét ngay'; btn.removeAttribute('disabled'); }
                                        }
                                    }}
                                    id="scanBtn"
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap disabled:bg-blue-300 cursor-pointer"
                                >
                                    🔍 Quét ngay
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t flex justify-end">
                        <button
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-300"
                        >
                            <Save className="w-4 h-4" />
                            {isSavingSettings ? 'Đang lưu...' : 'Lưu cấu hình'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'comments' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-slate-500 text-sm">Xem và quản lý bình luận trên các bài viết Facebook</p>
                        <button
                            type="button"
                            onClick={loadComments}
                            disabled={loadingComments}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition disabled:bg-blue-300"
                        >
                            <RefreshCw className={`w-4 h-4 ${loadingComments ? 'animate-spin' : ''}`} />
                            {loadingComments ? 'Đang tải...' : 'Tải lại'}
                        </button>
                    </div>

                    {/* Token Refresh */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm font-medium text-blue-800 mb-1">🔑 Làm mới Token Facebook</p>
                        <p className="text-xs text-blue-600 mb-3">Vào <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener" className="underline font-medium">Graph API Explorer</a> → chọn App LYHU → Generate Access Token → copy "Mã truy cập" dán vào đây. Hệ thống sẽ tự đổi sang token 60 ngày và cập nhật tất cả Page.</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="tokenRefreshInput"
                                placeholder="Dán mã truy cập (Access Token) từ Graph API Explorer..."
                                className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    const input = document.getElementById('tokenRefreshInput') as HTMLInputElement;
                                    const token = input?.value?.trim();
                                    if (!token) return toast.error('Dán mã truy cập vào ô bên trái');

                                    toast.info('Đang đổi sang token dài hạn...');
                                    try {
                                        // 1. Exchange for long-lived token + get page tokens
                                        const res = await fetch('/api/facebook/auth', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ short_token: token })
                                        });
                                        const data = await res.json();
                                        if (data.error) {
                                            toast.error('Lỗi: ' + data.error);
                                            return;
                                        }
                                        if (!data.pages?.length) {
                                            toast.error('Không tìm thấy Page nào');
                                            return;
                                        }

                                        // 2. Update each page in database & local state
                                        const { createClient } = await import('@/lib/supabaseClient');
                                        const supabase = createClient();
                                        let updated = 0;
                                        const updatedNames: string[] = [];
                                        for (const p of data.pages) {
                                            const { error } = await supabase
                                                .from('facebook_pages')
                                                .update({ access_token: p.access_token, name: p.name, avatar_url: p.avatar_url })
                                                .eq('page_id', p.page_id);
                                            if (!error) {
                                                updated++;
                                                updatedNames.push(p.name);
                                            } else {
                                                console.error('Update page error:', p.name, error);
                                            }
                                        }

                                        // 3. Update local pages state with new tokens
                                        setPages(prev => prev.map(page => {
                                            const newPage = data.pages.find((p: any) => p.page_id === page.page_id);
                                            if (newPage) {
                                                return { ...page, access_token: newPage.access_token, name: newPage.name, avatar_url: newPage.avatar_url };
                                            }
                                            return page;
                                        }));

                                        if (updated > 0) {
                                            toast.success(`✅ Đã cập nhật token 60 ngày cho ${updated} Page: ${updatedNames.join(', ')}`, { duration: 6000 });
                                        } else {
                                            toast.error('Không cập nhật được Page nào. Kiểm tra xem Page đã được kết nối chưa.');
                                        }
                                        input.value = '';
                                        // Reload comments with new tokens (delay to let state update)
                                        setTimeout(() => loadComments(), 1000);
                                    } catch (e: any) {
                                        toast.error('Lỗi: ' + e.message);
                                    }
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
                            >
                                🔄 Đổi token 60 ngày
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    const input = document.getElementById('tokenRefreshInput') as HTMLInputElement;
                                    const token = input?.value?.trim();
                                    if (!token) return toast.error('Dán mã truy cập vào ô bên trái');

                                    toast.info('Đang lưu token trực tiếp...');
                                    try {
                                        const { createClient } = await import('@/lib/supabaseClient');
                                        const supabase = createClient();

                                        // Update ALL pages with this token
                                        const { data: allPages } = await supabase.from('facebook_pages').select('id, page_id, name');
                                        let updated = 0;
                                        const updatedNames: string[] = [];
                                        for (const p of (allPages || [])) {
                                            const { error } = await supabase
                                                .from('facebook_pages')
                                                .update({ access_token: token })
                                                .eq('id', p.id);
                                            if (!error) {
                                                updated++;
                                                updatedNames.push(p.name);
                                            }
                                        }

                                        // Update local state
                                        setPages(prev => prev.map(p => ({ ...p, access_token: token })));

                                        if (updated > 0) {
                                            toast.success(`✅ Đã lưu token trực tiếp cho ${updated} Page: ${updatedNames.join(', ')}`, { duration: 6000 });
                                        } else {
                                            toast.error('Không tìm thấy Page nào trong DB');
                                        }
                                        input.value = '';
                                        setTimeout(() => loadComments(), 1000);
                                    } catch (e: any) {
                                        toast.error('Lỗi: ' + e.message);
                                    }
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition whitespace-nowrap"
                            >
                                💾 Lưu trực tiếp
                            </button>
                        </div>
                    </div>

                    {/* Manual Ad Post Input */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="text-sm font-medium text-orange-800 mb-2">📢 Thêm bài quảng cáo thủ công</p>
                        <p className="text-xs text-orange-600 mb-3">Dán link hoặc ID bài quảng cáo (lấy từ Ads Manager). VD: https://facebook.com/123456789/posts/987654321 hoặc 123456789_987654321</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="manualAdPostInput"
                                placeholder="Dán link hoặc Post ID..."
                                className="flex-1 border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    const input = document.getElementById('manualAdPostInput') as HTMLInputElement;
                                    if (!input?.value?.trim()) return toast.error('Nhập link hoặc ID bài viết');
                                    const page = pages.find(p => p.id === selectedPageId);
                                    if (!page) return toast.error('Chọn Fanpage trước');

                                    let postId = input.value.trim();
                                    // Extract post ID from various URL formats
                                    const urlMatch = postId.match(/(\d+)[\/_]posts[\/_](\d+)/);
                                    if (urlMatch) {
                                        postId = `${urlMatch[1]}_${urlMatch[2]}`;
                                    }
                                    const pfbidMatch = postId.match(/pfbid\w+/);
                                    if (pfbidMatch && !postId.includes('_')) {
                                        postId = `${page.page_id}_${pfbidMatch[0]}`;
                                    }

                                    toast.info('Đang tải bài viết...');
                                    try {
                                        const res = await fetch('/api/facebook/comments', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                page_id: page.page_id,
                                                access_token: page.access_token,
                                                action: 'manual_post',
                                                post_id: postId
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.success && data.post) {
                                            setCommentPosts(prev => {
                                                const exists = prev.some(p => p.id === data.post.id);
                                                if (exists) return prev;
                                                return [data.post, ...prev];
                                            });
                                            toast.success(`Đã thêm bài QC (${data.post.total_comments} bình luận)`);
                                            input.value = '';
                                        } else {
                                            toast.error(data.error || 'Không tìm thấy bài viết');
                                        }
                                    } catch (e: any) {
                                        toast.error('Lỗi: ' + e.message);
                                    }
                                }}
                                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition whitespace-nowrap"
                            >
                                + Thêm bài QC
                            </button>
                        </div>
                    </div>

                    {loadingComments && commentPosts.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p>Đang tải bài viết và bình luận...</p>
                        </div>
                    )}

                    {!loadingComments && commentPosts.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                            <p>Bấm "Tải lại" để xem bình luận</p>
                        </div>
                    )}

                    {commentPosts.map(post => (
                        <div key={post.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div
                                className="p-4 cursor-pointer hover:bg-slate-50 transition"
                                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                            >
                                <div className="flex items-start gap-3">
                                    {post.full_picture && (
                                        <img src={post.full_picture} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {post.is_ad && (
                                                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">📢 Quảng cáo</span>
                                            )}
                                            <span className="text-xs text-slate-400">{new Date(post.created_time).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 line-clamp-2">{post.message}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs">
                                            <span className="text-blue-600 font-medium">{post.total_comments} bình luận</span>
                                            <span className="text-red-500">{post.hidden_comments} đã ẩn</span>
                                            <span className="text-green-600">{post.total_comments - post.hidden_comments} hiển thị</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {post.is_ad && post.comments.some((c: any) => !c.is_hidden) && (
                                            <button
                                                type="button"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const page = pages.find(p => p.id === selectedPageId);
                                                    if (!page) return toast.error('Chọn Fanpage trước');
                                                    const visible = post.comments.filter((c: any) => !c.is_hidden && c.from_id !== page.page_id);
                                                    if (visible.length === 0) return toast.info('Không có comment cần ẩn');
                                                    toast.info(`Đang ẩn ${visible.length} bình luận...`);
                                                    let hidden = 0;
                                                    for (const c of visible) {
                                                        try {
                                                            await fetch('/api/facebook/comments', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ page_id: page.page_id, access_token: page.access_token, action: 'hide', comment_id: c.id })
                                                            });
                                                            hidden++;
                                                        } catch (err) { }
                                                    }
                                                    toast.success(`Đã ẩn ${hidden}/${visible.length} bình luận`);
                                                    loadComments();
                                                }}
                                                className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition whitespace-nowrap"
                                            >
                                                <EyeOff className="w-3 h-3 inline mr-1" />
                                                Ẩn tất cả
                                            </button>
                                        )}
                                        {expandedPost === post.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                    </div>
                                </div>
                            </div>

                            {expandedPost === post.id && (
                                <div className="border-t">
                                    {post.comments.length === 0 ? (
                                        <p className="p-4 text-sm text-slate-400 text-center">Chưa có bình luận</p>
                                    ) : (
                                        <div className="divide-y">
                                            {post.comments.map((comment: any) => (
                                                <div key={comment.id} className={`p-3 px-4 flex items-center justify-between gap-3 text-sm ${comment.is_hidden ? 'bg-red-50/50' : ''}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-slate-700">{comment.from_name}</span>
                                                            {comment.is_hidden && (
                                                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Đã ẩn</span>
                                                            )}
                                                            <span className="text-xs text-slate-400">{new Date(comment.created_time).toLocaleString('vi-VN')}</span>
                                                        </div>
                                                        <p className="text-slate-600 mt-0.5 truncate">{comment.message}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            const page = pages.find(p => p.id === selectedPageId);
                                                            if (!page) return toast.error('Chọn Fanpage');
                                                            const action = comment.is_hidden ? 'unhide' : 'hide';
                                                            try {
                                                                await fetch('/api/facebook/comments', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ page_id: page.page_id, access_token: page.access_token, action, comment_id: comment.id })
                                                                });
                                                                setCommentPosts(prev => prev.map(p => p.id === post.id ? {
                                                                    ...p,
                                                                    hidden_comments: comment.is_hidden ? p.hidden_comments - 1 : p.hidden_comments + 1,
                                                                    comments: p.comments.map((c: any) => c.id === comment.id ? { ...c, is_hidden: !comment.is_hidden } : c)
                                                                } : p));
                                                                toast.success(comment.is_hidden ? 'Đã bỏ ẩn' : 'Đã ẩn bình luận');
                                                            } catch (err) {
                                                                toast.error('Lỗi');
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${comment.is_hidden ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                                    >
                                                        {comment.is_hidden ? <><Eye className="w-3 h-3 inline mr-1" />Hiện</> : <><EyeOff className="w-3 h-3 inline mr-1" />Ẩn</>}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {post.permalink_url && (
                                        <div className="p-3 border-t bg-slate-50 text-center">
                                            <a href={post.permalink_url} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline">Xem trên Facebook ↗</a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">{editingRule ? 'Chỉnh sửa quy tắc' : 'Thêm quy tắc mới'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Từ khóa (Keyword)</label>
                                <input
                                    required
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: giá bao nhiêu, tư vấn..."
                                    value={formData.keyword}
                                    onChange={e => setFormData({ ...formData, keyword: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Loại khớp (Match Type)</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={formData.match_type}
                                    onChange={e => setFormData({ ...formData, match_type: e.target.value as any })}
                                >
                                    <option value="contains">Chứa từ khóa (Contains)</option>
                                    <option value="exact">Chính xác (Exact Match)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Loại phản hồi</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={formData.response_type}
                                    onChange={e => setFormData({ ...formData, response_type: e.target.value as any })}
                                >
                                    <option value="text">Văn bản (Text)</option>
                                    <option value="image">Hình ảnh (Image)</option>
                                </select>
                            </div>

                            {formData.response_type === 'image' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Link Ảnh (Media URL)</label>
                                    <input
                                        required
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="https://..."
                                        value={formData.media_url || ''}
                                        onChange={e => setFormData({ ...formData, media_url: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Nội dung phản hồi</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Nội dung tin nhắn trả lời..."
                                    value={formData.response_text}
                                    onChange={e => setFormData({ ...formData, response_text: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="activeCheck"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <label htmlFor="activeCheck" className="text-sm cursor-pointer select-none">Kích hoạt quy tắc này ngay</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Phạm vi áp dụng</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={formData.apply_to}
                                    onChange={e => setFormData({ ...formData, apply_to: e.target.value })}
                                >
                                    <option value="comment">Bình luận (Comment)</option>
                                    <option value="message">Tin nhắn (Message)</option>
                                    <option value="both">Cả hai</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Cách trả lời</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={formData.reply_method}
                                    onChange={e => setFormData({ ...formData, reply_method: e.target.value })}
                                >
                                    <option value="comment">Reply công khai (Comment)</option>
                                    <option value="inbox">Nhắn riêng (Inbox)</option>
                                    <option value="both">Cả hai (Comment + Inbox)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="autoHideCheck"
                                    checked={formData.auto_hide}
                                    onChange={e => setFormData({ ...formData, auto_hide: e.target.checked })}
                                    className="w-4 h-4 text-red-600"
                                />
                                <label htmlFor="autoHideCheck" className="text-sm cursor-pointer select-none text-red-600">🔒 Ẩn bình luận sau khi trả lời</label>
                            </div>

                            <div className="pt-4 flex gap-3">

                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 font-medium">Hủy</button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Lưu quy tắc
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
