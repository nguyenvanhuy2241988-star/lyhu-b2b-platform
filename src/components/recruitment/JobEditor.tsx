"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ArrowLeft, Save, Loader2, Calendar, Briefcase, MapPin, DollarSign, Building, Trash2 } from "lucide-react";
import { toast } from "sonner"; // Or usage of alert() if toast not set up extensively

interface JobEditorProps {
    jobId?: string; // If provided, edit mode. If not, create mode.
}

export default function JobEditor({ jobId }: JobEditorProps) {
    const router = useRouter();
    const isEditMode = !!jobId;

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        department: "",
        location: "Hồ Chí Minh",
        salary_range: "",
        employment_type: "Toàn thời gian",
        deadline: "",
        banner_url: "",
        status: "open",
        description: "",
        requirements: "",
        benefits: ""
    });

    useEffect(() => {
        if (isEditMode && jobId) {
            loadJob(jobId);
        }
    }, [jobId]);

    const loadJob = async (id: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('recruitment_jobs')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            setFormData({
                title: data.title || "",
                department: data.department || "",
                location: data.location || "Hồ Chí Minh",
                salary_range: data.salary_range || "",
                employment_type: data.employment_type || "Toàn thời gian",
                deadline: data.deadline ? data.deadline.split('T')[0] : "", // Format YYYY-MM-DD
                banner_url: data.banner_url || "",
                status: data.status || "open",
                description: data.description || "",
                requirements: data.requirements || "",
                benefits: data.benefits || ""
            });
        }
        setIsLoading(false);
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const supabase = createClient();
                const fileExt = file.name.split('.').pop();
                const fileName = `banner_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('recruitment_assets')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('recruitment_assets')
                    .getPublicUrl(fileName);

                setFormData({ ...formData, banner_url: data.publicUrl });
            } catch (err) {
                console.error("Banner upload failed", err);
                alert("Upload Banner thất bại");
            }
        }
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const supabase = createClient();
            const payload = {
                ...formData,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
            };

            if (isEditMode && jobId) {
                // Update
                const { error } = await supabase
                    .from('recruitment_jobs')
                    .update(payload)
                    .eq('id', jobId);
                if (error) throw error;
                // toast.success("Cập nhật thành công!");
            } else {
                // Create
                const { error } = await supabase
                    .from('recruitment_jobs')
                    .insert([payload]);
                if (error) throw error;
                // toast.success("Tạo tin mới thành công!");
            }

            // Navigate back
            router.push('/recruitment/jobs');
            router.refresh();

        } catch (err: any) {
            console.error(err);
            alert(`Lỗi: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isEditMode ? "Chỉnh sửa tin tuyển dụng" : "Tạo tin tuyển dụng mới"}
                        </h1>
                        <p className="text-slate-500 text-sm">Điền đầy đủ thông tin để thu hút ứng viên</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Delete Button (Edit Mode Only) */}
                    {isEditMode && jobId && (
                        <button
                            onClick={async () => {
                                if (confirm("Bạn có chắc chắn muốn xóa tin này không? Hành động này không thể hoàn tác.")) {
                                    try {
                                        setIsSaving(true);
                                        const { deleteJob } = await import('@/lib/recruitmentStore');
                                        await deleteJob(jobId);
                                        router.push('/recruitment/jobs');
                                        router.refresh();
                                    } catch (e) {
                                        console.error(e);
                                        alert("Xóa thất bại!");
                                        setIsSaving(false);
                                    }
                                }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Xóa tin tuyển dụng"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition font-medium shadow-sm disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEditMode ? "Lưu thay đổi" : "Đăng tin"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
                <div className="space-y-6">
                    {/* Banner Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh bìa (Public Banner)</label>
                        <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center group hover:border-primary-400 transition">
                            {formData.banner_url ? (
                                <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-slate-400 text-xs">Upload Banner (1200x630)</span>
                            )}
                            <input type="file" accept="image/*" onChange={handleBannerUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-2">Thông tin chung</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí tuyển dụng <span className="text-red-500">*</span></label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="VD: Nhân viên kinh doanh"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phòng ban</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Sales, Marketing..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mức lương</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        value={formData.salary_range}
                                        onChange={e => setFormData({ ...formData, salary_range: e.target.value })}
                                        className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="10 - 15 triệu"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Loại hình</label>
                                <select
                                    value={formData.employment_type}
                                    onChange={e => setFormData({ ...formData, employment_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                >
                                    <option value="Toàn thời gian">Toàn thời gian</option>
                                    <option value="Bán thời gian">Bán thời gian</option>
                                    <option value="Thực tập">Thực tập</option>
                                    <option value="Hợp đồng">Hợp đồng</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Hạn nộp hồ sơ</label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái tin</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                            >
                                <option value="open" className="text-green-600">Đang tuyển (Public)</option>
                                <option value="draft" className="text-slate-500">Nháp (Ẩn)</option>
                                <option value="closed" className="text-red-500">Đã đóng</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                        <div>
                            <label className="block text-base font-semibold text-slate-800 mb-2">Mô tả công việc (Description)</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none min-h-[150px] leading-relaxed"
                                placeholder="- Mô tả chi tiết các đầu việc hàng ngày..."
                            />
                            <p className="text-xs text-slate-400 mt-1 text-right">Hỗ trợ xuống dòng, gạch đầu dòng</p>
                        </div>

                        <div>
                            <label className="block text-base font-semibold text-slate-800 mb-2">Yêu cầu ứng viên (Requirements)</label>
                            <textarea
                                value={formData.requirements}
                                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none min-h-[150px] leading-relaxed"
                                placeholder="- Kinh nghiệm, kỹ năng cần thiết..."
                            />
                        </div>

                        <div>
                            <label className="block text-base font-semibold text-slate-800 mb-2">Quyền lợi (Benefits)</label>
                            <textarea
                                value={formData.benefits}
                                onChange={e => setFormData({ ...formData, benefits: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none min-h-[150px] leading-relaxed"
                                placeholder="- Chế độ lương thưởng, bảo hiểm, đào tạo..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
