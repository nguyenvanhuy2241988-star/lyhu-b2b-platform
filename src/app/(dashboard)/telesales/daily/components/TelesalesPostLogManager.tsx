"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Plus, Trash2, Link as LinkIcon, Image as ImageIcon, ExternalLink, Pencil, MessageSquare, Share2, UserPlus, Phone } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getTelesalesPostLogs, createTelesalesPostLog, deleteTelesalesPostLog, updateTelesalesPostLog, TelesalesPostLog, syncTelesalesLogsToDailyReport, syncGroupFromPostLog, getTelesalesFbGroups, TelesalesFbGroup, FB_GROUP_CATEGORIES } from "@/lib/telesalesDailyStore";
import { cn } from "@/lib/utils";

interface TelesalesPostLogManagerProps {
    userId: string;
    date: string;
    onUpdate?: () => void; // Callback when logs change
    readOnly?: boolean;
}

export default function TelesalesPostLogManager({ userId, date, onUpdate, readOnly = false }: TelesalesPostLogManagerProps) {
    const [logs, setLogs] = useState<TelesalesPostLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [savedGroups, setSavedGroups] = useState<TelesalesFbGroup[]>([]);
    const [showGroupDropdown, setShowGroupDropdown] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const groupDropdownRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const [newLog, setNewLog] = useState<{
        platform: string;
        activity_type: string;
        group_name: string;
        group_link: string;
        group_note: string;
        post_link: string;
        image_url: string;
    }>({
        platform: 'facebook_group',
        activity_type: 'post',
        group_name: '',
        group_link: '',
        group_note: '',
        post_link: '',
        image_url: ''
    });

    useEffect(() => {
        loadLogs();
        loadSavedGroups();
    }, [userId, date]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target as Node)) {
                setShowGroupDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadSavedGroups = async () => {
        try {
            const groups = await getTelesalesFbGroups({ status: 'active' });
            setSavedGroups(groups || []);
        } catch (e) {
            console.error('Error loading saved groups:', e);
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await getTelesalesPostLogs(userId, date);
            setLogs(data || []);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error loading logs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Shared upload helper for file input, paste, and drag-drop
    const uploadFile = useCallback(async (file: File) => {
        try {
            setUploading(true);
            const fileExt = file.name?.split('.').pop() || 'png';
            const fileName = `telesales_${userId}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('report-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('report-images')
                .getPublicUrl(filePath);

            setNewLog(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error: any) {
            alert('Lỗi upload ảnh: ' + error.message);
        } finally {
            setUploading(false);
        }
    }, [userId]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        await uploadFile(e.target.files[0]);
    };

    // Clipboard paste handler
    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) await uploadFile(file);
                return;
            }
        }
    }, [uploadFile]);

    // Drag & drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            await uploadFile(file);
        }
    }, [uploadFile]);

    // Listen for paste events when form is open
    useEffect(() => {
        if (!showForm || readOnly) return;
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [showForm, readOnly, handlePaste]);

    const handleEdit = (log: TelesalesPostLog) => {
        setNewLog({
            platform: log.platform,
            activity_type: log.activity_type || 'post',
            group_name: log.group_name || '',
            group_link: log.group_link || '',
            group_note: log.group_note || '',
            post_link: log.post_link || '',
            image_url: log.image_url || ''
        });
        setEditingLogId(log.id);
        setShowForm(true);
    };

    const handleSaveLog = async () => {
        if (!newLog.post_link && !newLog.image_url) {
            alert("Vui lòng nhập Link bài viết hoặc tải ảnh minh chứng!");
            return;
        }

        try {
            const logData: any = {
                platform: newLog.platform,
                activity_type: newLog.activity_type,
                group_name: newLog.group_name,
                group_link: newLog.group_link,
                group_note: newLog.group_note,
                post_link: newLog.post_link,
                image_url: newLog.image_url,
            };

            if (editingLogId) {
                await updateTelesalesPostLog(editingLogId, logData);
            } else {
                await createTelesalesPostLog({
                    user_id: userId,
                    report_date: date,
                    ...logData,
                    content_excerpt: 'Added via Daily Report'
                });
            }

            // Sync with Daily Report for correct history counts
            await syncTelesalesLogsToDailyReport(userId, date);

            // Auto-sync group to telesales_fb_groups if it's a facebook_group post
            if ((newLog.platform === 'facebook_group' || newLog.platform === 'facebook_page') && newLog.group_name.trim()) {
                try {
                    await syncGroupFromPostLog(newLog.group_name, newLog.group_link, userId);
                } catch (e) {
                    console.error('Error syncing group:', e);
                }
            }

            handleCancel();
            loadLogs();
        } catch (error: any) {
            alert("Lỗi khi lưu: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa minh chứng này?")) return;
        try {
            await deleteTelesalesPostLog(id);
            await syncTelesalesLogsToDailyReport(userId, date);
            loadLogs();
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingLogId(null);
        setNewLog({
            platform: 'facebook_group',
            activity_type: 'post',
            group_name: '',
            group_link: '',
            group_note: '',
            post_link: '',
            image_url: ''
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                    Minh chứng ({logs.length})
                </h2>
                {!readOnly && (
                    <button
                        onClick={() => {
                            handleCancel();
                            setShowForm(!showForm);
                        }}
                        className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-1 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Thêm mới
                    </button>
                )}
            </div>

            {/* Add/Edit Form — placed above list for convenience */}
            {showForm && !readOnly && (
                <div className="bg-slate-50 p-4 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2 mb-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">
                        {editingLogId ? "Chỉnh sửa minh chứng" : "Thêm minh chứng mới"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Cài đặt Nền tảng</label>
                            <select
                                className="w-full px-3 py-2 text-sm border rounded-md bg-white text-slate-700 font-medium"
                                value={newLog.platform}
                                onChange={(e) => setNewLog({ ...newLog, platform: e.target.value })}
                            >
                                <option value="zalo">Zalo</option>
                                <option value="facebook_group">Facebook Group</option>
                                <option value="facebook_personal">Facebook Cá nhân</option>
                                <option value="facebook_page">Facebook Page</option>
                                <option value="tiktok">Tiktok</option>
                                <option value="other">Tương tác khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Loại Hoạt động</label>
                            <select
                                className="w-full px-3 py-2 text-sm border rounded-md bg-white text-slate-700 font-medium"
                                value={newLog.activity_type}
                                onChange={(e) => setNewLog({ ...newLog, activity_type: e.target.value })}
                            >
                                <option value="post">Đăng bài (Mồi Marketing)</option>
                                <option value="comment">Bình luận dạo (Seeding)</option>
                                <option value="message">Nhắn tin / Chào hàng</option>
                                <option value="friend">Gửi kết bạn</option>
                            </select>
                        </div>

                        {/* Optional Info based on platform */}
                        {(newLog.platform === 'facebook_group' || newLog.platform === 'facebook_page') && (
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="relative" ref={groupDropdownRef}>
                                    <label className="text-xs font-medium text-slate-600 block mb-1">Tên Nhóm / Page lấy data</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-sm border rounded-md"
                                        placeholder="Gõ tên nhóm để tìm..."
                                        value={newLog.group_name}
                                        onFocus={() => setShowGroupDropdown(true)}
                                        onChange={(e) => {
                                            setNewLog({ ...newLog, group_name: e.target.value });
                                            setShowGroupDropdown(true);
                                        }}
                                    />
                                    {/* Custom searchable dropdown */}
                                    {showGroupDropdown && (
                                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {savedGroups
                                                .filter(g => !newLog.group_name || g.name.toLowerCase().includes(newLog.group_name.toLowerCase()))
                                                .map(g => {
                                                    const catInfo = FB_GROUP_CATEGORIES.find((c: any) => c.key === g.category);
                                                    return (
                                                        <button
                                                            key={g.id}
                                                            type="button"
                                                            className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between gap-2 text-sm border-b border-gray-50 last:border-0 transition-colors ${g.status === 'banned' ? 'bg-red-50/50' : ''
                                                                }`}
                                                            onClick={() => {
                                                                setNewLog({
                                                                    ...newLog,
                                                                    group_name: g.name,
                                                                    group_link: g.link || newLog.group_link,
                                                                });
                                                                setShowGroupDropdown(false);
                                                            }}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-gray-800 truncate">{g.name}</div>
                                                                {g.link && <div className="text-[10px] text-gray-400 truncate">{g.link}</div>}
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {catInfo && (
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${catInfo.color}`}>
                                                                        {catInfo.label}
                                                                    </span>
                                                                )}
                                                                {g.status === 'banned' && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">⛔ Cấm</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            {savedGroups.filter(g => !newLog.group_name || g.name.toLowerCase().includes(newLog.group_name.toLowerCase())).length === 0 && (
                                                <div className="px-3 py-3 text-xs text-gray-400 text-center">
                                                    {newLog.group_name ? `Không tìm thấy "${newLog.group_name}" — nhóm mới sẽ được tạo tự động` : 'Chưa có nhóm nào'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {newLog.group_name && savedGroups.find(g => g.name === newLog.group_name && g.status === 'banned') && (
                                        <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Nhóm này đã bị đánh dấu CẤM ĐĂNG!</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-1">Link Nhóm / Nguồn</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-sm border rounded-md"
                                        placeholder="https://facebook.com/groups/..."
                                        value={newLog.group_link}
                                        onChange={(e) => setNewLog({ ...newLog, group_link: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-slate-600 block mb-1">Link Dẫn Trực Tiếp (Đến nick zalo, comment hoặc bài đăng)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border rounded-md"
                                placeholder="Có thể bỏ qua nếu đã có ảnh chụp..."
                                value={newLog.post_link}
                                onChange={(e) => setNewLog({ ...newLog, post_link: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-slate-600 block mb-1">Ảnh minh chứng <span className="text-slate-400 font-normal">(Rất quan trọng cho báo cáo Zalo)</span></label>
                            <div
                                className={cn(
                                    "relative border-2 border-dashed rounded-lg p-4 transition-all",
                                    isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300",
                                    uploading && "opacity-60 pointer-events-none"
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {uploading ? (
                                    <div className="flex items-center justify-center gap-2 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        <span className="text-xs text-blue-600 font-medium">Đang tải lên server...</span>
                                    </div>
                                ) : newLog.image_url ? (
                                    <div className="flex items-center gap-3">
                                        <img src={newLog.image_url} alt="Preview" className="w-16 h-16 rounded-lg object-cover shadow-sm border border-slate-200" />
                                        <div className="flex-1">
                                            <p className="text-xs text-green-600 font-semibold">✓ Đã nạp ảnh!</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Paste ảnh mới (Ctrl+V) hoặc kéo thả để thay thế</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNewLog(prev => ({ ...prev, image_url: '' }))}
                                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Xóa ảnh"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 py-2">
                                        <div className="flex items-center gap-3">
                                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                                                <ImageIcon className="w-4 h-4 text-blue-500" />
                                                <span className="text-xs text-slate-700 font-medium">Chọn ảnh</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                            </label>
                                            <span className="text-xs text-slate-400">hoặc</span>
                                            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                                                <kbd className="text-[10px] bg-white border border-slate-300 rounded px-1 py-0.5 font-mono text-slate-600 shadow-sm">Ctrl</kbd>
                                                <span className="text-[10px] text-slate-400">+</span>
                                                <kbd className="text-[10px] bg-white border border-slate-300 rounded px-1 py-0.5 font-mono text-slate-600 shadow-sm">V</kbd>
                                                <span className="text-xs text-slate-500 font-medium ml-1">Paste ảnh</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400">Kéo thả ảnh vào đây cũng được</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-slate-600 block mb-1">Giải trình (Tùy chọn)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border rounded-md"
                                placeholder="Vd: Nick zalo A đã châm lại..."
                                value={newLog.group_note}
                                onChange={(e) => setNewLog({ ...newLog, group_note: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={handleCancel} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800">
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleSaveLog}
                            className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
                            disabled={uploading}
                        >
                            {editingLogId ? "Cập nhật" : "Lưu vào báo cáo"}
                        </button>
                    </div>
                </div>
            )}

            {/* List Existing Logs */}
            <div className="space-y-3 mb-4">
                {loading ? (
                    <div className="text-center py-4 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-slate-500 text-sm">Chưa có tương tác / mồi chài / ảnh Zalo nào được lưu hôm nay.</p>
                        {showForm && <p className="text-xs text-blue-600 mt-1">Điền thông tin bên trên để thêm.</p>}
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex gap-4 p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors group">
                            {/* Image Preview */}
                            <div className="w-20 h-20 bg-slate-100 rounded-md flex-shrink-0 overflow-hidden border border-slate-200 relative group/img">
                                {log.image_url ? (
                                    <>
                                        <img src={log.image_url} alt="Evidence" className="w-full h-full object-cover" />
                                        <a href={log.image_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 hidden group-hover/img:flex items-center justify-center text-white transition-all">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full font-medium capitalize flex items-center gap-1 w-max",
                                        log.activity_type === 'comment' ? "bg-orange-100 text-orange-700" :
                                            log.activity_type === 'message' ? "bg-green-100 text-green-700" :
                                                log.activity_type === 'friend' ? "bg-purple-100 text-purple-700" :
                                                    "bg-blue-100 text-blue-700"
                                    )}>
                                        {log.activity_type === 'comment' && <MessageSquare className="w-3 h-3" />}
                                        {log.activity_type === 'message' && <Phone className="w-3 h-3" />}
                                        {log.activity_type === 'friend' && <UserPlus className="w-3 h-3" />}
                                        {log.activity_type === 'friend' ? 'Kết bạn' : (
                                            log.activity_type === 'message' ? 'Nhắn tin CSKH' : (log.activity_type || 'post')
                                        )}
                                    </span>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full font-medium capitalize w-max",
                                        log.platform.includes('facebook') ? "bg-blue-100 text-blue-700" :
                                            log.platform === 'zalo' ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-700"
                                    )}>
                                        {log.platform.replace('_', ' ')}
                                    </span>
                                    {log.group_name && (
                                        <span className="text-sm font-medium text-slate-900 truncate block">
                                            {log.group_name}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {log.post_link && (
                                        <a href={log.post_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium truncate w-fit max-w-[200px] sm:max-w-[400px]">
                                            <ExternalLink className="w-3 h-3 min-w-[12px]" /> Xem link
                                        </a>
                                    )}
                                    {log.group_note && (
                                        <p className="text-xs text-slate-500 italic truncate w-full">
                                            {log.group_note}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {!readOnly && (
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all self-center">
                                    <button onClick={() => handleEdit(log)} className="p-2 text-slate-400 hover:text-blue-600" title="Sửa">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(log.id)} className="p-2 text-slate-400 hover:text-red-600" title="Xóa">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
