"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Link as LinkIcon, Image as ImageIcon, ExternalLink, Pencil, MessageSquare, Share2, UserPlus, Users, DollarSign, Star, Briefcase, Phone } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getAffiliatePostLogs, upsertAffiliatePostLog, deleteAffiliatePostLog } from "@/lib/affiliateStore";
import { cn } from "@/lib/utils";

interface AffiliatePostLogManagerProps {
    userId: string;
    date: string;
    onUpdate?: () => void;
    readOnly?: boolean;
}

export default function AffiliatePostLogManager({ userId, date, onUpdate, readOnly = false }: AffiliatePostLogManagerProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);

    const [newLog, setNewLog] = useState<{
        platform: string;
        post_type: string;
        group_name: string;
        group_link: string;
        group_notes: string;
        post_link: string;
        image_url: string;
        follower_count: string;
        industry: string;
        contact_info: string;
        potential_rating: string;
        booking_cost: string;
    }>({
        platform: 'facebook_group',
        post_type: 'post',
        group_name: '',
        group_link: '',
        group_notes: '',
        post_link: '',
        image_url: '',
        follower_count: '',
        industry: '',
        contact_info: '',
        potential_rating: 'Tốt',
        booking_cost: ''
    });

    useEffect(() => {
        loadLogs();
    }, [userId, date]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await getAffiliatePostLogs(userId, date);
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

    const handleEdit = (log: any) => {
        setNewLog({
            platform: log.platform || 'facebook_group',
            post_type: log.post_type || 'post',
            group_name: log.group_name || '',
            group_link: log.group_link || '',
            group_notes: log.group_notes || '',
            post_link: log.post_link || '',
            image_url: log.image_url || '',
            follower_count: log.follower_count || '',
            industry: log.industry || '',
            contact_info: log.contact_info || '',
            potential_rating: log.potential_rating || 'Tốt',
            booking_cost: log.booking_cost || ''
        });
        setEditingLogId(log.id);
        setShowForm(true);
    };

    const handleSaveLog = async () => {
        if (!newLog.post_link && !newLog.image_url && !newLog.contact_info) {
            alert("Vui lòng nhập Link hoặc SĐT liên hệ hoặc tải ảnh minh chứng!");
            return;
        }

        try {
            const logData: any = {
                platform: newLog.platform,
                post_type: newLog.post_type,
                group_name: newLog.group_name,
                group_link: newLog.group_link,
                group_notes: newLog.group_notes,
                post_link: newLog.post_link,
                image_url: newLog.image_url,
                follower_count: newLog.follower_count,
                industry: newLog.industry,
                contact_info: newLog.contact_info,
                potential_rating: newLog.potential_rating,
                booking_cost: newLog.booking_cost,
            };

            if (editingLogId) {
                await upsertAffiliatePostLog({ id: editingLogId, ...logData });
            } else {
                await upsertAffiliatePostLog({
                    user_id: userId,
                    date: date,
                    ...logData
                });
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
            await deleteAffiliatePostLog(id);
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
            post_type: 'post',
            group_name: '',
            group_link: '',
            group_notes: '',
            post_link: '',
            image_url: '',
            follower_count: '',
            industry: '',
            contact_info: '',
            potential_rating: 'Tốt',
            booking_cost: ''
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-6 bg-teal-600 rounded-full"></span>
                    Hồ sơ & Minh chứng ({logs.length})
                </h2>
                {!readOnly && (
                    <button
                        onClick={() => {
                            handleCancel();
                            setShowForm(!showForm);
                        }}
                        className="text-sm px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 font-medium flex items-center gap-1 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Thêm mới
                    </button>
                )}
            </div>

            <div className="space-y-3 mb-4">
                {loading ? (
                    <div className="text-center py-4 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-slate-500 text-sm">Chưa có minh chứng / hồ sơ nào hôm nay.</p>
                        {showForm && <p className="text-xs text-teal-600 mt-1">Điền thông tin bên dưới để thêm.</p>}
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors group">
                            <div className="w-20 h-20 bg-slate-200 rounded-md flex-shrink-0 overflow-hidden border border-slate-300">
                                {log.image_url ? (
                                    <img src={log.image_url} alt="Evidence" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                                        log.platform.includes('shopee') || log.platform.includes('lazada') || log.platform.includes('tiki') ? "bg-orange-100 text-orange-700" :
                                        log.platform.includes('facebook') ? "bg-blue-100 text-blue-700" :
                                        log.platform === 'tiktok' || log.platform === 'tiktok_shop' ? "bg-black/5 text-black" : "bg-slate-200 text-slate-700"
                                    )}>
                                        {log.platform.replace('_', ' ')}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900 truncate">
                                        {log.group_name || 'Liên hệ trực tiếp'}
                                    </span>
                                    {log.potential_rating && (
                                        <span className="text-xs px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 font-medium flex items-center gap-1">
                                            <Star className="w-3 h-3" /> {log.potential_rating}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                                    {log.contact_info && (
                                        <div className="flex items-center gap-1.5 text-slate-600 truncate">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="font-medium text-slate-800">{log.contact_info}</span>
                                        </div>
                                    )}
                                    {log.industry && (
                                        <div className="flex items-center gap-1.5 text-slate-600 truncate">
                                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{log.industry}</span>
                                        </div>
                                    )}
                                    {log.follower_count && (
                                        <div className="flex items-center gap-1.5 text-slate-600 truncate">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{log.follower_count} follow</span>
                                        </div>
                                    )}
                                    {log.booking_cost && (
                                        <div className="flex items-center gap-1.5 text-slate-600 truncate">
                                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Booking: {log.booking_cost}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1 mt-3">
                                    {log.group_link && (
                                        <a href={log.group_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 truncate">
                                            <LinkIcon className="w-3 h-3" /> Link Nguồn/Profile: {log.group_link}
                                        </a>
                                    )}
                                    {log.post_link && (
                                        <a href={log.post_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-teal-600 hover:underline font-medium truncate">
                                            <ExternalLink className="w-3 h-3" /> Xem link bài viết / chi tiết
                                        </a>
                                    )}
                                    {log.group_notes && (
                                        <p className="text-xs text-slate-500 italic mt-1 bg-white p-2 rounded border border-slate-100">
                                            Ghi chú: {log.group_notes}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!readOnly && (
                                <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-all self-start pt-2">
                                    <button onClick={() => handleEdit(log)} className="p-2 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-teal-600 shadow-sm">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(log.id)} className="p-2 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-red-600 shadow-sm">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showForm && !readOnly && (
                <div className="bg-slate-50 p-5 rounded-xl border border-teal-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">
                        {editingLogId ? "Chỉnh sửa hồ sơ / minh chứng" : "Thêm hồ sơ KOL/KOC / Minh chứng"}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Loại hình</label>
                            <select
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                                value={newLog.post_type}
                                onChange={(e) => setNewLog({ ...newLog, post_type: e.target.value })}
                            >
                                <option value="kol_koc">Hồ sơ KOL / KOC</option>
                                <option value="ctv">Hồ sơ CTV / Đại lý</option>
                                <option value="post">Bài đăng tuyển dụng</option>
                                <option value="seeding">Seeding / Comment</option>
                                <option value="friend">Kết bạn / Nhắn tin</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Nền tảng</label>
                            <select
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                                value={newLog.platform}
                                onChange={(e) => setNewLog({ ...newLog, platform: e.target.value })}
                            >
                                <optgroup label="Mạng xã hội">
                                    <option value="facebook_group">Facebook Group</option>
                                    <option value="facebook_page">Facebook Page</option>
                                    <option value="facebook_personal">Facebook Cá nhân</option>
                                    <option value="tiktok">TikTok</option>
                                    <option value="zalo">Zalo</option>
                                    <option value="threads">Threads</option>
                                    <option value="linkedin">LinkedIn</option>
                                </optgroup>
                                <optgroup label="Sàn TMĐT">
                                    <option value="shopee">Shopee</option>
                                    <option value="tiktok_shop">TikTok Shop</option>
                                    <option value="lazada">Lazada</option>
                                    <option value="tiki">Tiki</option>
                                </optgroup>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Tên KOL/CTV hoặc Nhóm</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Vd: Nguyễn Văn A..."
                                value={newLog.group_name}
                                onChange={(e) => setNewLog({ ...newLog, group_name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* KOL Specific Info */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-4 mb-[-8px]">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin hồ sơ (Bắt buộc nếu là KOL/CTV)</span>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Ngành hàng</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Vd: Mẹ & Bé, Mỹ phẩm..."
                                value={newLog.industry}
                                onChange={(e) => setNewLog({ ...newLog, industry: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Lượt Follow</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Vd: 150k"
                                value={newLog.follower_count}
                                onChange={(e) => setNewLog({ ...newLog, follower_count: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">SĐT / Zalo liên hệ</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="09xxxx..."
                                value={newLog.contact_info}
                                onChange={(e) => setNewLog({ ...newLog, contact_info: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Đánh giá tiềm năng</label>
                            <select
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                value={newLog.potential_rating}
                                onChange={(e) => setNewLog({ ...newLog, potential_rating: e.target.value })}
                            >
                                <option value="Rất Tốt">Rất Tốt</option>
                                <option value="Tốt">Tốt</option>
                                <option value="Trung Bình">Trung bình</option>
                                <option value="Chưa Rõ">Chưa rõ</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-slate-600 block mb-1">Chi phí hợp tác (Booking / Lương cứng...)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Vd: 500k/video hoặc Không có"
                                value={newLog.booking_cost}
                                onChange={(e) => setNewLog({ ...newLog, booking_cost: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-slate-600 block mb-1">Link Kênh / Profile CTV</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="https://tiktok.com/@..."
                                value={newLog.group_link}
                                onChange={(e) => setNewLog({ ...newLog, group_link: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Link bài đăng / bài Seeding (Nếu có)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="https://..."
                                value={newLog.post_link}
                                onChange={(e) => setNewLog({ ...newLog, post_link: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Ghi chú thêm</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Vd: KOL yêu cầu gửi hàng mẫu, CTV chuyên bán live..."
                                value={newLog.group_notes}
                                onChange={(e) => setNewLog({ ...newLog, group_notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mb-6 bg-white p-3 border border-slate-200 rounded-lg">
                        <label className="text-xs font-medium text-slate-600 block mb-2">Ảnh minh chứng / Chụp màn hình tin nhắn</label>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-medium">
                                <ImageIcon className="w-4 h-4 text-slate-600" />
                                <span className="text-sm text-slate-700">{uploading ? "Đang tải..." : "Tải ảnh lên"}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                            {newLog.image_url && (
                                <div className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                                    <img src={newLog.image_url} alt="Preview" className="w-8 h-8 rounded object-cover shadow-sm" />
                                    <span className="font-medium">Đã đính kèm ảnh</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                        <button onClick={handleCancel} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            Hủy
                        </button>
                        <button onClick={handleSaveLog} className="px-6 py-2 text-sm font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all flex items-center gap-2">
                            {editingLogId ? "Cập nhật hồ sơ" : "Lưu hồ sơ mới"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
