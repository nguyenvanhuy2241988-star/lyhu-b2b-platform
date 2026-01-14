import { useState, useEffect } from 'react';
import { SocialConversation, updateConversationMetadata } from '@/lib/marketingStore';
import { User, Tag, FileText, ShoppingBag, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';

interface InboxCustomerSidebarProps {
    conversation: SocialConversation;
    onUpdate: (updates: Partial<SocialConversation>) => void;
    onCreateDeal?: () => void;
    token?: string;
}

export default function InboxCustomerSidebar({ conversation, onUpdate, onCreateDeal, token }: InboxCustomerSidebarProps) {
    const [notes, setNotes] = useState(conversation.notes || '');
    const [tags, setTags] = useState<string[]>(conversation.tags || []);
    const [newTag, setNewTag] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);

    // Sync props to state when conversation changes
    useEffect(() => {
        setNotes(conversation.notes || '');
        setTags(conversation.tags || []);
    }, [conversation.id]);

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
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-200 overflow-hidden mb-3">
                    {conversation.customer_avatar ? (
                        <img src={conversation.customer_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-10 h-10 text-slate-400 m-5" />
                    )}
                </div>
                <h3 className="font-bold text-lg">{conversation.customer_name}</h3>
                <div className="flex justify-center gap-2 mt-2">
                    {conversation.platform === 'facebook' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Facebook User</span>
                    )}
                    {conversation.source_type && (
                        <span className={`text-xs px-2 py-1 rounded-full border ${conversation.source_type === 'ads' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            conversation.source_type === 'post' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                            {conversation.source_type === 'ads' ? 'Từ Quảng Cáo' : conversation.source_type === 'post' ? 'Từ Bài viết' : 'Tự nhiên'}
                        </span>
                    )}
                </div>
                {conversation.source_detail?.ad_id && (
                    <p className="text-xs text-slate-400 mt-1">Ads ID: {conversation.source_detail.ad_id}</p>
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
                    onClick={() => window.open(`https://facebook.com/${conversation.external_id}`, '_blank')}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
                >
                    <ExternalLink className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">Xem Profile</span>
                </button>
            </div>

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
                            }} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-500 hover:border-blue-300 hover:text-blue-600">
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
                    className="w-full flex-1 border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-yellow-50 placeholder:text-yellow-700/50"
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
