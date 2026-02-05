'use client';

import { useState, useEffect } from "react";
import { Plus, Loader2, X, Edit, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface EventFormModalProps {
    onSuccess?: () => void;
    initialData?: any; // Pass existing event data for editing
    eventId?: string; // If present, mode is EDIT
    trigger?: React.ReactNode; // Custom trigger button
}

export default function EventFormModal({ onSuccess, initialData, eventId, trigger }: EventFormModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('event-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, banner_url: data.publicUrl }));
        } catch (error: any) {
            alert('Lỗi upload ảnh: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const isEditMode = !!eventId;

    // Helper to extract date/time string
    const formatDateTime = (isoString?: string) => {
        if (!isoString) return { date: '', time: '09:00' };
        const d = new Date(isoString);
        return {
            date: d.toISOString().split('T')[0],
            time: d.toTimeString().slice(0, 5)
        };
    };

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        event_type: "party",
        status: "draft",
        start_date: "",
        start_time: "09:00",
        end_date: "",
        end_time: "17:00",
        location: "",
        banner_url: "",
        budget_total: 0,
        priority: 0
    });

    useEffect(() => {
        if (open && initialData) {
            const start = formatDateTime(initialData.start_time);
            const end = formatDateTime(initialData.end_time);
            setFormData({
                title: initialData.title || "",
                description: initialData.description || "",
                event_type: initialData.event_type || "party",
                status: initialData.status || "draft",
                start_date: start.date,
                start_time: start.time,
                end_date: end.date,
                end_time: end.time,
                location: initialData.location || "",
                banner_url: initialData.banner_url || "",
                budget_total: initialData.budget_total || 0,
                priority: initialData.priority || 0
            });
        } else if (open && !initialData) {
            // Reset if opening in create mode
            setFormData({
                title: "",
                description: "",
                event_type: "party",
                status: "draft",
                start_date: "",
                start_time: "09:00",
                end_date: "",
                end_time: "17:00",
                location: "",
                banner_url: "",
                budget_total: 0,
                priority: 0
            });
        }
    }, [open, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Combine date and time
            const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
            const endDateTime = new Date(`${formData.end_date || formData.start_date}T${formData.end_time}`);

            const payload: any = {
                title: formData.title,
                description: formData.description,
                event_type: formData.event_type,
                status: formData.status,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                location: formData.location,
                banner_url: formData.banner_url || null,
                budget_total: formData.budget_total,
                priority: Number(formData.priority)
            };

            // Removed manual status override

            let result;

            if (isEditMode) {
                result = await supabase
                    .from('hr_events')
                    .update(payload)
                    .eq('id', eventId)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('hr_events')
                    .insert(payload)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            setOpen(false);
            if (onSuccess) onSuccess();
            router.refresh();

            // Redirect if creating new
            if (!isEditMode && result.data?.id) {
                router.push(`/events/${result.data.id}`);
            }

        } catch (error: any) {
            console.error(error);
            alert(`Lỗi khi ${isEditMode ? 'cập nhật' : 'tạo'} sự kiện: ` + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger || (
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        Tạo sự kiện mới
                    </button>
                )}
            </div>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-900">
                                {isEditMode ? 'Cập nhật sự kiện' : 'Lên kế hoạch sự kiện mới'}
                            </h2>
                            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Tên sự kiện <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ví dụ: Tiệc Tất Niên 2026"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Trạng thái</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300 bg-white"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="draft">Bản nháp (Chỉ Admin)</option>
                                        <option value="published">Công khai</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Độ ưu tiên (Sắp xếp)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-slate-500">Số càng lớn càng hiển thị lên trên.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Loại sự kiện <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300 bg-white"
                                        value={formData.event_type}
                                        onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                    >
                                        <option value="party">Tiệc / Liên hoan</option>
                                        <option value="birthday">Sinh nhật</option>
                                        <option value="trip">Team Building / Du lịch</option>
                                        <option value="meeting">Họp mặt / Đào tạo</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Địa điểm <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Tại văn phòng, Nhà hàng ABC..."
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Ngày bắt đầu <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        placeholder="Bỏ trống nếu trong ngày"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Ảnh bìa / Poster</label>

                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 transition-colors hover:border-teal-500 hover:bg-teal-50/30 text-center relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleBannerUpload}
                                            disabled={uploading}
                                        />

                                        {formData.banner_url ? (
                                            <div className="relative z-20">
                                                <img
                                                    src={formData.banner_url}
                                                    alt="Banner Preview"
                                                    className="w-full h-auto max-h-[300px] object-contain rounded-lg shadow-sm mx-auto"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation(); // Avoid triggering input
                                                            setFormData({ ...formData, banner_url: "" });
                                                        }}
                                                        className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-sm z-30"
                                                        title="Xóa ảnh"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none flex items-center justify-center">
                                                    {/* Visual cue only */}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-slate-500">
                                                {uploading ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                                                        <span>Đang tải lên...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="p-3 bg-slate-100 rounded-full">
                                                            <ImageIcon className="w-6 h-6 text-slate-400" />
                                                        </div>
                                                        <p className="font-medium">Nhấn để tải ảnh bìa lên</p>
                                                        <p className="text-xs text-slate-400">PNG, JPG, GIF (Max 5MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Ngân sách dự kiến (VNĐ)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300"
                                        value={formData.budget_total}
                                        onChange={(e) => setFormData({ ...formData, budget_total: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Mô tả chi tiết</label>
                                    <textarea
                                        placeholder="Nội dung chương trình, lưu ý..."
                                        className="w-full min-h-[100px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 border-slate-300"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition-colors"
                                    disabled={loading}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow-lg shadow-teal-200 transition-colors disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isEditMode ? 'Cập nhật' : 'Tạo kế hoạch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

