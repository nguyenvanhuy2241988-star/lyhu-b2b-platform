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
        if (p.length > 0) setSelectedPageId(p[0].id);
    };

    const handleSaveSettings = async () => {
        if (!selectedPageId) return toast.error("Vui lòng chọn Fanpage");
        
        setIsSavingSettings(true);
        try {
            const page = pages.find(p => p.id === selectedPageId);
            if (!page || !page.access_token) throw new Error("Page Token not found");

            await updateMessengerProfile(page.page_id, page.access_token, {
                greeting_text: greetingText
                // Add persistent_menu logic here later
            });
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

    const filteredRules = rules.filter(r =>
        r.keyword.toLowerCase().includes(search.toLowerCase()) ||
        r.response_text.toLowerCase().includes(search.toLowerCase())
    );

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
                                    {filteredRules.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-400">
                                                <Bot className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                Chưa có quy tắc nào
                                            </td>
                                        </tr>
                                    ) : filteredRules.map(rule => (
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

                        <div>
                            <label className="block text-sm font-medium mb-1">Menu Chính (Persistent Menu)</label>
                            <p className="text-xs text-slate-500 mb-2">Hiện tại hỗ trợ cấu hình qua API. Sẽ cập nhật UI sau.</p>
                            <div className="bg-slate-50 p-4 rounded border text-sm text-slate-600">
                                <p>Để cài đặt Menu, vui lòng liên hệ Admin hoặc sử dụng API trực tiếp.</p>
                            </div>
                        </div>

                        <div className="pt-4">
                             <button
                                onClick={handleSaveSettings}
                                disabled={isSavingSettings}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {isSavingSettings ? 'Đang lưu...' : 'Lưu & Đẩy lên Facebook'}
                            </button>
                        </div>
                     </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-lg">{editingRule ? 'Sửa quy tắc' : 'Thêm quy tắc mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Từ khóa (Key)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ví dụ: giá, bao nhiêu, địa chỉ..."
                                    value={formData.keyword}
                                    onChange={e => setFormData({ ...formData, keyword: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Loại khớp (Match Type)</label>
                                <select
                                    className="w-full border rounded-lg p-2 outline-none"
                                    value={formData.match_type}
                                    onChange={e => setFormData({ ...formData, match_type: e.target.value as any })}
                                >
                                    <option value="contains">Chứa từ khóa (Contains)</option>
                                    <option value="exact">Khớp chính xác (Exact)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Loại tin nhắn (Response Type)</label>
                                <select
                                    className="w-full border rounded-lg p-2 outline-none"
                                    value={formData.response_type || 'text'}
                                    onChange={e => setFormData({ ...formData, response_type: e.target.value as any })}
                                >
                                    <option value="text">Văn bản (Text)</option>
                                    <option value="image">Hình ảnh (Image)</option>
                                </select>
                            </div>

                            {formData.response_type === 'image' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Link Ảnh (Image URL)</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="https://example.com/image.jpg"
                                        value={formData.media_url || ''}
                                        onChange={e => setFormData({ ...formData, media_url: e.target.value })}
                                    />
                                    {formData.media_url && (
                                        <div className="mt-2 relative w-full h-32 rounded border overflow-hidden bg-slate-100">
                                            <img src={formData.media_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {formData.response_type === 'image' ? 'Chú thích (Caption)' : 'Câu trả lời (Response)'}
                                </label>
                                <textarea
                                    required={formData.response_type === 'text'}
                                    rows={4}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder={formData.response_type === 'image' ? "Nhập chú thích ảnh..." : "Nhập nội dung tin nhắn..."}
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
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 font-medium"
                                </button>
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
