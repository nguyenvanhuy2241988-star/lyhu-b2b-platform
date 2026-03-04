"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Link as LinkIcon, Image as ImageIcon, ExternalLink, Pencil, MessageSquare, Share2, UserPlus, Phone } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getTelesalesPostLogs, createTelesalesPostLog, deleteTelesalesPostLog, updateTelesalesPostLog, TelesalesPostLog, syncTelesalesLogsToDailyReport, syncGroupFromPostLog, getTelesalesFbGroups, TelesalesFbGroup } from "@/lib/telesalesDailyStore";
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `telesales_${userId}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Ensure bucket report-images exists or uploading might fail. We use global report-images
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
    };

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

            {/* List Existing Logs */}
            <div className="space-y-3 mb-4">
                {loading ? (
                    <div className="text-center py-4 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-slate-500 text-sm">Chưa có tương tác / mồi chài / ảnh Zalo nào được lưu hôm nay.</p>
                        {showForm && <p className="text-xs text-blue-600 mt-1">Điền thông tin bên dưới để thêm.</p>}
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

            {/* Add/Edit Form */}
            {showForm && !readOnly && (
                <div className="bg-slate-50 p-4 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
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
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-1">Tên Nhóm / Page lấy data</label>
                                    <input
                                        type="text"
                                        list="saved-groups-list"
                                        className="w-full px-3 py-2 text-sm border rounded-md"
                                        placeholder="Vd: Chợ thực phẩm HN..."
                                        value={newLog.group_name}
                                        onChange={(e) => {
                                            const selectedGroup = savedGroups.find(g => g.name === e.target.value);
                                            if (selectedGroup) {
                                                setNewLog({ ...newLog, group_name: selectedGroup.name, group_link: selectedGroup.link || newLog.group_link });
                                            } else {
                                                setNewLog({ ...newLog, group_name: e.target.value });
                                            }
                                        }}
                                    />
                                    <datalist id="saved-groups-list">
                                        {savedGroups.map(g => (
                                            <option key={g.id} value={g.name}>{g.name}{g.status === 'banned' ? ' ⛔ Bị cấm' : ''}</option>
                                        ))}
                                    </datalist>
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
                            <div className="flex items-center gap-4">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-dashed border-blue-300 rounded-lg hover:bg-white transition-colors bg-white">
                                    <ImageIcon className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs text-slate-600 font-medium">{uploading ? "Đang tải server..." : "Chọn ảnh chụp màn hình"}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                                {newLog.image_url && (
                                    <div className="text-xs text-green-600 flex items-center gap-2 bg-green-50 px-2 py-1 rounded-md">
                                        <img src={newLog.image_url} alt="Preview" className="w-10 h-10 rounded object-cover shadow-sm" />
                                        <span className="font-semibold">Đã nạp ảnh!</span>
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
        </div>
    );
}
