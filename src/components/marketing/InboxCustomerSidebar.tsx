import { useState, useEffect, useMemo } from 'react';
import { SocialConversation, SocialMessage, updateConversationMetadata } from '@/lib/marketingStore';
import { User, Tag, FileText, ShoppingBag, ExternalLink, X, Phone, MapPin, Image } from 'lucide-react';
import { toast } from 'sonner';
import { isAdConversation, manualSourceUpdate, shortAdId } from '@/lib/conversationSource';
import { FbAdInfo } from '@/lib/fbAds';
import InboxAdDetails from '@/components/marketing/InboxAdDetails';

interface InboxCustomerSidebarProps {
    conversation: SocialConversation;
    messages?: SocialMessage[];
    onUpdate: (updates: Partial<SocialConversation>) => void;
    onCreateDeal?: () => void;
    token?: string;
    adInfo?: FbAdInfo | null;
}

export default function InboxCustomerSidebar({ conversation, messages = [], onUpdate, onCreateDeal, token, adInfo }: InboxCustomerSidebarProps) {
    const [notes, setNotes] = useState(conversation.notes || '');
    const [tags, setTags] = useState<string[]>(conversation.tags || []);
    const [newTag, setNewTag] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [customerPhone, setCustomerPhone] = useState(conversation.customer_phone || '');
    const [customerRegion, setCustomerRegion] = useState(conversation.customer_region || '');
    const isAdLead = isAdConversation(conversation);

    const handleToggleSourceType = async () => {
        const nextIsAd = !isAdLead;
        if (!nextIsAd && conversation.ad_id &&
            !window.confirm(`Khách này có mã quảng cáo ${shortAdId(conversation)}. Chuyển về Tự nhiên sẽ xoá mã này. Tiếp tục?`)) {
            return;
        }
        const updates: any = manualSourceUpdate(nextIsAd);
        try {
            const ok = await updateConversationMetadata(conversation.id, updates, token);
            if (!ok) throw new Error('update failed');
            onUpdate(updates);
            toast.success(nextIsAd ? 'Đã chuyển nguồn sang: Quảng cáo' : 'Đã chuyển nguồn sang: Tự nhiên');
        } catch (e) {
            toast.error('Lỗi cập nhật nguồn');
        }
    };

    // Reset avatar error when conversation changes
    useEffect(() => {
        setAvatarError(false);
    }, [conversation.id]);

    // Sync props to state when conversation changes or customer info is auto-detected
    useEffect(() => {
        setNotes(conversation.notes || '');
        setTags(conversation.tags || []);
        setCustomerPhone(conversation.customer_phone || '');
        setCustomerRegion(conversation.customer_region || '');
    }, [conversation.id, conversation.customer_phone, conversation.customer_region]);

    const handleSaveNote = async () => {
        setIsSavingNote(true);
        try {
            await updateConversationMetadata(conversation.id, { notes }, token);
            onUpdate({ notes });
            toast.success("Đã lưu ghi chú");
        } catch (e) {
            toast.error("Lỗi lưu ghi chú");
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleSaveCustomerInfo = async (field: 'customer_phone' | 'customer_region', value: string) => {
        try {
            await updateConversationMetadata(conversation.id, { [field]: value }, token);
            onUpdate({ [field]: value } as any);
            toast.success(field === 'customer_phone' ? 'Đã lưu SĐT' : 'Đã lưu khu vực');
        } catch (e) {
            toast.error('Lỗi lưu thông tin');
        }
    };

    const handleAddTag = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            const updatedTags = [...tags, newTag.trim()];
            setTags(updatedTags);
            setNewTag('');
            await updateConversationMetadata(conversation.id, { tags: updatedTags }, token);
            onUpdate({ tags: updatedTags });
        }
    };

    const removeTag = async (tagToRemove: string) => {
        const updatedTags = tags.filter(t => t !== tagToRemove);
        setTags(updatedTags);
        await updateConversationMetadata(conversation.id, { tags: updatedTags }, token);
        onUpdate({ tags: updatedTags });
    };

    // --- Suggest Tags (Mock) ---
    const suggestedTags = ['VIP', 'Đã mua', 'Tiềm năng', 'Spam', 'Khó tính'];

    return (
        <div className="w-80 border-l bg-white flex flex-col h-full overflow-y-auto">
            {/* Header / Profile */}
            <div className="p-6 border-b text-center">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 flex items-center justify-center" style={{ background: avatarError ? `hsl(${(conversation.customer_name || 'U').charCodeAt(0) * 37 % 360}, 60%, 75%)` : '#e2e8f0' }}>
                    {!avatarError ? (
                        <img
                            src={`/api/facebook/avatar?psid=${conversation.external_id}&page_id=${(conversation as any).fb_page_id || ''}`}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() => setAvatarError(true)}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <span className="text-2xl font-bold text-white">
                            {(conversation.customer_name || 'U').charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <h3 className="font-bold text-lg">{conversation.customer_name}</h3>
                <div className="flex justify-center gap-2 mt-2">
                    {conversation.platform === 'facebook' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Facebook User</span>
                    )}
                    <button
                        onClick={handleToggleSourceType}
                        title="Bấm để đổi nhanh nguồn (Tự nhiên / Quảng cáo)"
                        className="transition hover:scale-105 active:scale-95"
                    >
                        {isAdLead ? (
                            <span className="text-xs px-2 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                📢 Từ Quảng Cáo ⇄
                            </span>
                        ) : (
                            <span className="text-xs px-2 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                                🌱 Tự nhiên ⇄
                            </span>
                        )}
                    </button>
                </div>
                {isAdLead && (
                    <div className="mt-3">
                        <InboxAdDetails variant="card" conversation={conversation} ad={adInfo} messages={messages} />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 grid grid-cols-2 gap-2 border-b">
                <button
                    onClick={onCreateDeal}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
                >
                    <ShoppingBag className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">Tạo Đơn sales</span>
                </button>
                <button
                    onClick={async () => {
                        // Mở ĐÚNG cuộc trò chuyện trên Facebook; từ đó bấm "Xem trang cá nhân".
                        // (Meta không cấp link trang cá nhân của khách qua API.)
                        const win = window.open('about:blank', '_blank'); // mở trước để không bị chặn popup
                        const toUrl = (l: string) => (l.startsWith('http') ? l : `https://www.facebook.com${l}`);
                        let url = conversation.customer_profile_url ? toUrl(conversation.customer_profile_url) : '';
                        if (!url) {
                            try {
                                const res = await fetch('/api/facebook/conversation-link', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                                    body: JSON.stringify({ conversation_id: conversation.id }),
                                });
                                const json = await res.json();
                                url = json?.url || '';
                                if (json?.exact) onUpdate({ customer_profile_url: url } as any);
                                else toast.info('Không tìm được đúng cuộc trò chuyện, mở hộp thư của Fanpage.');
                            } catch { /* dùng dự phòng bên dưới */ }
                        }
                        if (!url) {
                            const pageId = (conversation as any).fb_page_id;
                            url = pageId
                                ? `https://business.facebook.com/latest/inbox/all?asset_id=${pageId}`
                                : 'https://business.facebook.com/latest/inbox/all';
                        }
                        if (win) win.location.href = url; else window.open(url, '_blank');
                    }}
                    title="Mở cuộc trò chuyện trên Facebook, bấm 'Xem trang cá nhân' để xem profile khách"
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
                >
                    <ExternalLink className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">Xem Facebook khách</span>
                </button>
            </div>

            {/* Customer Info */}
            <div className="p-4 border-b space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                    <User className="w-4 h-4" />
                    Thông tin khách hàng
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] placeholder:text-slate-400"
                            placeholder="Số điện thoại..."
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            onBlur={() => handleSaveCustomerInfo('customer_phone', customerPhone)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] placeholder:text-slate-400"
                            placeholder="Khu vực (VD: HCM, Hà Nội...)"
                            value={customerRegion}
                            onChange={e => setCustomerRegion(e.target.value)}
                            onBlur={() => handleSaveCustomerInfo('customer_region', customerRegion)}
                        />
                    </div>

                    {/* Source Page */}
                    {conversation.page_name && (
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="text-sm text-slate-600">
                                <span className="text-slate-400 text-xs">Fanpage:</span>{' '}
                                <span className="font-medium text-slate-800">{conversation.page_name}</span>
                            </div>
                        </div>
                    )}

                    {/* Customer Source: Ads vs Organic */}
                    <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="text-sm">
                            <span className="text-slate-400 text-xs">Nguồn:</span>{' '}
                            <button
                                onClick={handleToggleSourceType}
                                title="Bấm để đổi nguồn"
                                className="transition hover:opacity-80"
                            >
                                {isAdLead ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                        📢 Quảng cáo {shortAdId(conversation)} ⇄
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                        🌱 Tự nhiên ⇄
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Customer Type (Cho phép Sale đổi nhanh) */}
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <select
                            value={conversation.customer_type || ''}
                            onChange={async (e) => {
                                const newType = e.target.value || undefined;
                                const updates = { customer_type: newType };
                                try {
                                    await updateConversationMetadata(conversation.id, updates, token);
                                    onUpdate(updates);
                                    toast.success('Đã cập nhật loại khách hàng');
                                } catch {
                                    toast.error('Lỗi cập nhật');
                                }
                            }}
                            className="text-xs rounded-full px-2.5 py-1 border border-slate-200 bg-white font-medium text-slate-700 hover:border-blue-400 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">❓ Chưa xác định loại KH</option>
                            <option value="Bán sỉ">📦 Bán sỉ</option>
                            <option value="Mua lẻ">🛒 Mua lẻ</option>
                            <option value="Đại lý">🏪 Đại lý</option>
                            <option value="Nhà phân phối">🏢 Nhà phân phối</option>
                            <option value="Tạp hóa">🏠 Tạp hóa</option>
                            <option value="Cửa hàng">🏬 Cửa hàng / Shop</option>
                            <option value="Quán ăn">🍜 Quán ăn / Điểm bán</option>
                        </select>
                    </div>

                    {/* Interested Products (Cho phép xem, thêm nhiều món, xóa sản phẩm) */}
                    <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">Sản phẩm quan tâm:</span>
                            <select
                                value=""
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    const current = (conversation.interested_products || []).filter(p => p !== 'Báo giá chung');
                                    if (current.includes(val)) return;
                                    const next = [...current, val];
                                    const updates = { interested_products: next };
                                    try {
                                        await updateConversationMetadata(conversation.id, updates, token);
                                        onUpdate(updates);
                                        toast.success(`Đã thêm: ${val}`);
                                    } catch {
                                        toast.error('Lỗi thêm sản phẩm');
                                    }
                                }}
                                className="text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                            >
                                <option value="">+ Thêm món</option>
                                <option value="Khoai môn sấy CVT">🥔 Khoai môn sấy CVT</option>
                                <option value="Kẹo dẻo UHi">🍬 Kẹo dẻo UHi</option>
                                <option value="Bột phô mai BOYO">🧀 Bột phô mai BOYO</option>
                                <option value="Bánh tráng BOYO">🍘 Bánh tráng BOYO</option>
                                <option value="Snack ăn vặt">🍿 Snack ăn vặt</option>
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {(!conversation.interested_products || conversation.interested_products.filter(p => p !== 'Báo giá chung').length === 0) ? (
                                <span className="text-xs text-slate-400 italic">Chưa gắn sản phẩm</span>
                            ) : (
                                conversation.interested_products.filter(p => p !== 'Báo giá chung').map((p, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-full">
                                        🏷️ {p}
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const next = (conversation.interested_products || []).filter(x => x !== p);
                                                const updates = { interested_products: next };
                                                try {
                                                    await updateConversationMetadata(conversation.id, updates, token);
                                                    onUpdate(updates);
                                                } catch {
                                                    toast.error('Lỗi xóa sản phẩm');
                                                }
                                            }}
                                            className="hover:text-red-600 text-amber-500 font-bold ml-0.5 cursor-pointer"
                                            title="Xóa sản phẩm này"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shared Media & Files */}
            {(() => {
                const sharedMedia = messages
                    .filter(m => !m.is_from_page && m.attachments && m.attachments.length > 0)
                    .flatMap(m => m.attachments || []);
                const images = sharedMedia.filter(a => a.type === 'image');
                const files = sharedMedia.filter(a => a.type !== 'image');
                if (sharedMedia.length === 0) return null;
                return (
                    <div className="p-4 border-b space-y-2">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                            <Image className="w-4 h-4" />
                            Ảnh & Tệp tin ({sharedMedia.length})
                        </div>
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-1">
                                {images.slice(0, 9).map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img.url}
                                        alt={img.name || 'shared'}
                                        className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition"
                                        onClick={() => window.open(img.url, '_blank')}
                                    />
                                ))}
                                {images.length > 9 && (
                                    <div className="w-full h-16 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-500">+{images.length - 9}</div>
                                )}
                            </div>
                        )}
                        {files.length > 0 && (
                            <div className="space-y-1">
                                {files.slice(0, 5).map((f, idx) => (
                                    <a key={idx} href={f.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs text-blue-600 hover:underline truncate">
                                        📎 {f.name || 'Tệp đính kèm'}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Tags */}
            <div className="p-4 border-b space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                    <Tag className="w-4 h-4" />
                    Nhãn dán (Tags)
                </div>
                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <span key={tag} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs flex items-center gap-1 group">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="group-hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                    <input
                        className="bg-transparent text-xs outline-none min-w-[50px] placeholder:text-slate-400"
                        placeholder="+ Thêm"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                    />
                </div>
                {/* Suggestions */}
                {tags.length === 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {suggestedTags.map(t => (
                            <button key={t} onClick={() => {
                                // Add logic duplicated for brevity, ideally refactor
                                const updatedTags = [...tags, t];
                                setTags(updatedTags);
                                updateConversationMetadata(conversation.id, { tags: updatedTags }, token);
                                onUpdate({ tags: updatedTags });
                            }} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-500 hover:border-[#00AFA9] hover:text-[#00AFA9]">
                                + {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm mb-2">
                    <FileText className="w-4 h-4" />
                    Ghi chú nội bộ
                </div>
                <textarea
                    className="w-full flex-1 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AFA9] resize-none bg-yellow-50 placeholder:text-yellow-700/50"
                    placeholder="Ghi chú về khách hàng này..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={handleSaveNote}
                />
                <p className="text-[10px] text-slate-400 mt-2 text-right">
                    {isSavingNote ? 'Đang lưu...' : 'Tự động lưu khi ẩn chuột'}
                </p>
            </div>
        </div>
    );
}
