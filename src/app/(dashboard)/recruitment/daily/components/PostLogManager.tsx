"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Link as LinkIcon, Image as ImageIcon, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getPostLogs, createPostLog, deletePostLog, PostLog } from "@/lib/recruitmentStore";
import { cn } from "@/lib/utils";

interface PostLogManagerProps {
    userId: string;
    date: string;
    onUpdate?: () => void; // Callback when logs change (to update counts)
}

export default function PostLogManager({ userId, date, onUpdate }: PostLogManagerProps) {
    const [logs, setLogs] = useState<PostLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // New Log Form State
    const [newLog, setNewLog] = useState<{
        platform: string;
        group_name: string;
        group_link: string;
        post_link: string;
        image_url: string;
    }>({
        platform: 'facebook_group',
        group_name: '',
        group_link: '',
        post_link: '',
        image_url: ''
    });

    useEffect(() => {
        loadLogs();
    }, [userId, date]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await getPostLogs(userId, date);
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
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
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
    };

    const handleAddLog = async () => {
        if (!newLog.post_link) {
            alert("Vui lòng nhập Link bài viết!");
            return;
        }

        try {
            await createPostLog({
                user_id: userId,
                date: date,
                platform: newLog.platform as any,
                group_name: newLog.group_name,
                group_link: newLog.group_link,
                post_link: newLog.post_link,
                image_url: newLog.image_url,
                content_excerpt: 'Added via Daily Report'
            });

            // Reset form
            setNewLog({
                platform: 'facebook_group',
                group_name: '',
                group_link: '',
                post_link: '',
                image_url: ''
            });
            setShowForm(false);
            loadLogs();
        } catch (error: any) {
            alert("Lỗi khi thêm: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa minh chứng này?")) return;
        try {
            await deletePostLog(id);
            loadLogs();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-6 bg-teal-600 rounded-full"></span>
                    Minh chứng Đăng bài ({logs.length})
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="text-sm px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 font-medium flex items-center gap-1 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Thêm bài
                </button>
            </div>

            {/* List Existing Logs */}
            <div className="space-y-3 mb-4">
                {loading ? (
                    <div className="text-center py-4 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-slate-500 text-sm">Chưa có bài đăng nào hôm nay.</p>
                        {showForm && <p className="text-xs text-teal-600 mt-1">Điền thông tin bên dưới để thêm.</p>}
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex gap-4 p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors group">
                            {/* Image Preview */}
                            <div className="w-20 h-20 bg-slate-100 rounded-md flex-shrink-0 overflow-hidden border border-slate-200">
                                {log.image_url ? (
                                    <img src={log.image_url} alt="Evidence" className="w-full h-full object-cover" />
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
                                        "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                                        log.platform.includes('facebook') ? "bg-blue-100 text-blue-700" :
                                            log.platform === 'threads' ? "bg-black/5 text-black" : "bg-slate-100 text-slate-700"
                                    )}>
                                        {log.platform.replace('_', ' ')}
                                    </span>
                                    <span className="text-sm font-medium text-slate-900 truncate">
                                        {log.group_name || 'Không tên nhóm'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {log.group_link && (
                                        <a href={log.group_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 truncate">
                                            <LinkIcon className="w-3 h-3" /> Link nhóm: {log.group_link}
                                        </a>
                                    )}
                                    <a href={log.post_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium truncate">
                                        <ExternalLink className="w-3 h-3" /> Xem bài viết trực tiếp
                                    </a>
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                onClick={() => handleDelete(log.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 transition-all self-center"
                                title="Xóa"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add New Form */}
            {showForm && (
                <div className="bg-slate-50 p-4 rounded-lg border border-teal-100 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Thêm minh chứng mới</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Nền tảng</label>
                            <select
                                className="w-full px-3 py-2 text-sm border rounded-md"
                                value={newLog.platform}
                                onChange={(e) => setNewLog({ ...newLog, platform: e.target.value })}
                            >
                                <option value="facebook_group">Facebook Group</option>
                                <option value="facebook_page">Facebook Page</option>
                                <option value="threads">Threads</option>
                                <option value="zalo">Zalo</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Tên Nhóm / Page</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border rounded-md"
                                placeholder="Vd: Tìm việc làm Hà Nội..."
                                value={newLog.group_name}
                                onChange={(e) => setNewLog({ ...newLog, group_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Link Nhóm</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border rounded-md"
                                placeholder="https://facebook.com/groups/..."
                                value={newLog.group_link}
                                onChange={(e) => setNewLog({ ...newLog, group_link: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Link Bài viết <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border rounded-md"
                                placeholder="https://..."
                                value={newLog.post_link}
                                onChange={(e) => setNewLog({ ...newLog, post_link: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Ảnh minh chứng</label>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg hover:bg-white transition-colors bg-white">
                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-xs text-slate-600">{uploading ? "Đang tải..." : "Chọn ảnh"}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                            {newLog.image_url && (
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                    <img src={newLog.image_url} alt="Preview" className="w-8 h-8 rounded object-cover border" />
                                    <span>Đã tải lên</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAddLog}
                            className="px-4 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 shadow-sm"
                        >
                            Lưu minh chứng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
