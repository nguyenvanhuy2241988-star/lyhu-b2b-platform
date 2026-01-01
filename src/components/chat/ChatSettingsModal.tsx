import { useState, useRef } from 'react';
import { useChatStore, Conversation } from '@/lib/chatStore';
import { X, Users, UserPlus, LogOut, Check, Trash2, Edit2 } from 'lucide-react';
import { useToast } from "@/components/ui/toast";

interface ChatSettingsModalProps {
    conversation: Conversation;
    currentUser: any;
    users: any[];
    onClose: () => void;
}

export function ChatSettingsModal({ conversation, currentUser, users, onClose }: ChatSettingsModalProps) {
    const { updateConversationName, addParticipants, leaveConversation } = useChatStore();
    const { showToast } = useToast();

    // State
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(conversation.name || "");
    const [isAdding, setIsAdding] = useState(false);
    const [searchUser, setSearchUser] = useState("");
    const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filtered users to add
    const currentMemberIds = conversation.internal_participants?.map((p: any) => p.user_id) || [];
    const availableUsers = users.filter(u =>
        !currentMemberIds.includes(u.id) &&
        (u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase()))
    );

    const handleRename = async () => {
        if (!newName.trim()) return;
        setIsLoading(true);
        try {
            await updateConversationName(conversation.id, newName);
            showToast('Đã đổi tên nhóm thành công', 'success');
            setIsRenaming(false);
        } catch (error) {
            showToast('Lỗi khi đổi tên nhóm', 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMembers = async () => {
        if (selectedToAdd.length === 0) return;
        setIsLoading(true);
        try {
            await addParticipants(conversation.id, selectedToAdd);
            showToast('Đã thêm thành viên mới', 'success');
            setIsAdding(false);
            setSelectedToAdd([]);
        } catch (error) {
            showToast('Lỗi khi thêm thành viên', 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm('Bạn có chắc chắn muốn rời nhóm này?')) return;
        setIsLoading(true);
        try {
            await leaveConversation(conversation.id, currentUser.id);
            showToast('Đã rời nhóm', 'info');
            onClose(); // Close modal and likely redirect handled by store/page
        } catch (error) {
            showToast('Lỗi khi rời nhóm', 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelectUser = (id: string) => {
        setSelectedToAdd(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Cài đặt nhóm</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-6">
                    {/* 1. Group Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên nhóm</label>
                        <div className="flex gap-2">
                            {isRenaming ? (
                                <>
                                    <input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="Nhập tên nhóm..."
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleRename}
                                        disabled={isLoading || !newName.trim()}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setIsRenaming(false); setNewName(conversation.name || ""); }}
                                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="font-medium text-slate-800">{conversation.name || "Chưa đặt tên"}</span>
                                    <button onClick={() => setIsRenaming(true)} className="text-blue-600 hover:text-blue-800">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Members */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Thành viên ({conversation.internal_participants?.length || 0})</label>
                            {!isAdding && (
                                <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
                                    <UserPlus className="w-3 h-3" /> Thêm
                                </button>
                            )}
                        </div>

                        {/* Add Member UI */}
                        {isAdding && (
                            <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg animate-in slide-in-from-top-2">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        value={searchUser}
                                        onChange={(e) => setSearchUser(e.target.value)}
                                        className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded bg-white"
                                        placeholder="Tìm người dùng..."
                                    />
                                    <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded text-slate-600">Hủy</button>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded p-1 mb-2">
                                    {availableUsers.length === 0 ? (
                                        <div className="text-center text-xs text-slate-400 py-4">Không tìm thấy người dùng</div>
                                    ) : availableUsers.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleSelectUser(u.id)}
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedToAdd.includes(u.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedToAdd.includes(u.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                                                {selectedToAdd.includes(u.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-xs font-medium">{u.full_name || u.email}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddMembers}
                                    disabled={selectedToAdd.length === 0 || isLoading}
                                    className="w-full py-1.5 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Thêm {selectedToAdd.length} thành viên
                                </button>
                            </div>
                        )}

                        {/* Member List */}
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {conversation.internal_participants?.map((p: any) => {
                                const user = users.find(u => u.id === p.user_id);
                                const isMe = p.user_id === currentUser.id;
                                return (
                                    <div key={p.user_id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {user?.email?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-slate-800 truncate">
                                                {user?.full_name || user?.email || "Unknown"} {isMe && "(Bạn)"}
                                            </div>
                                            <div className="text-[10px] text-slate-500">Thành viên</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer - Danger Zone */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={handleLeave}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors font-medium text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Rời nhóm
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                        Chỉ thành viên nhóm mới có thể xem tin nhắn cũ.
                    </p>
                </div>
            </div>
        </div>
    );
}
