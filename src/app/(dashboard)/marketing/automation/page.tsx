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
import { Plus, Trash2, Edit, Zap, X, Save, Search, Bot } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationPage() {
    const { user, session } = useAuth();
    const token = session?.access_token;
    const [rules, setRules] = useState<ChatbotRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Tabs State
    const [activeTab, setActiveTab] = useState<'rules' | 'settings'>('rules');

    // Settings State
    const [greetingText, setGreetingText] = useState('');
    const [autoHidePhone, setAutoHidePhone] = useState(false);
    const [persistentMenu, setPersistentMenu] = useState<any[]>([]);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [pages, setPages] = useState<any[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<ChatbotRule | null>(null);
    const [formData, setFormData] = useState<Partial<ChatbotRule>>({
        keyword: '',
        match_type: 'contains',
        response_text: '',
        response_type: 'text',
        media_url: '',
        is_active: true
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
                setGreetingText(p[0].chatbot_config.greeting_text || '');
                setAutoHidePhone(p[0].chatbot_config.auto_hide_phone || false);
                setPersistentMenu(p[0].chatbot_config.persistent_menu || []);
            }
        }
    };

    // When select changes, update local state
    useEffect(() => {
        if (selectedPageId && pages.length > 0) {
            const p = pages.find(page => page.id === selectedPageId);
            if (p) {
                setGreetingText(p.chatbot_config?.greeting_text || '');
                setAutoHidePhone(p.chatbot_config?.auto_hide_phone || false);
                setPersistentMenu(p.chatbot_config?.persistent_menu || []);
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
                persistent_menu: persistentMenu,
                // Add persistent_menu logic here later
            });

            // Optimistic update
            setPages(prev => prev.map(p => p.id === selectedPageId ? {
                ...p,
                chatbot_config: { ...p.chatbot_config, greeting_text: greetingText, auto_hide_phone: autoHidePhone, persistent_menu: persistentMenu }
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
                is_active: rule.is_active
            });
        } else {
            setEditingRule(null);
            setFormData({
                keyword: '',
                match_type: 'contains',
                response_text: '',
                response_type: 'text',
                media_url: '',
                is_active: true
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

                    <div className="pt-2">
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
                                    Ẩn bình luận chứa Số điện thoại
                                </label>
                                <p className="text-xs text-red-500">Bình luận có 10 chữ số sẽ tự động bị ẩn đi để tránh cướp khách.</p>
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
                                <label htmlFor="activeCheck" className="text-sm cursor-pointer select-none">Kích hoạt quy tắc nảy ngay</label>
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
