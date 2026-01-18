"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Loader2, CheckCircle, Send, MapPin, Briefcase, FileUp, X, Upload } from "lucide-react";
import Link from "next/link";

type PublicJob = {
    id: string;
    title: string;
    location: string;
    status: string;
    description?: string;
    requirements?: string;
    benefits?: string;
    banner_url?: string;
};

type CompanySettings = {
    company_name: string;
    logo_url: string;
    description: string;
    culture_description?: string;
    culture_images: string[];
};

export default function ApplyPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const jobId = params.jobId as string;
    const source = searchParams.get("source") || "Direct Link";

    const [job, setJob] = useState<PublicJob | null>(null);
    const [company, setCompany] = useState<CompanySettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        email: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!jobId) return;
            const supabase = createClient();

            // 1. Fetch Job
            const jobReq = supabase
                .from('recruitment_jobs')
                .select('id, title, location, status, description, requirements, benefits, banner_url')
                .eq('id', jobId)
                .single();

            // 2. Fetch Company Settings
            const settingsReq = supabase
                .from('recruitment_settings')
                .select('company_name, logo_url, description, culture_description, culture_images')
                .maybeSingle();

            const [jobRes, settingsRes] = await Promise.all([jobReq, settingsReq]);

            if (jobRes.data) setJob(jobRes.data);
            if (settingsRes.data) setCompany(settingsRes.data);

            setIsLoading(false);
        };
        loadData();
    }, [jobId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Simple validation
            if (file.size > 5 * 1024 * 1024) { // 5MB
                alert("File quá lớn! Vui lòng chọn file dưới 5MB.");
                return;
            }
            setSelectedFile(file);
        }
    };

    const uploadCV = async (file: File): Promise<string | null> => {
        if (!file) return null;
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${jobId}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('recruitment_cvs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data } = supabase.storage
                .from('recruitment_cvs')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (err) {
            console.error("Upload failed", err);
            alert("Lỗi tải file lên. Vui lòng thử lại.");
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let cvUrl = "";

            // 1. Upload CV if exists
            if (selectedFile) {
                const url = await uploadCV(selectedFile);
                if (!url) {
                    setIsSubmitting(false);
                    return; // Stop if upload failed
                }
                cvUrl = url;
            }

            const supabase = createClient();

            // 2. Submit Application
            const { error: rpcError } = await supabase.rpc('submit_application', {
                p_job_id: jobId,
                p_full_name: formData.full_name,
                p_email: formData.email,
                p_phone: formData.phone,
                p_cv_url: cvUrl,
                p_source: source
            });

            if (rpcError) throw rpcError;

            setIsSuccess(true);
        } catch (error: any) {
            console.error("Submission error:", error);
            alert("Lỗi gửi hồ sơ: " + (error?.message || "Vui lòng thử lại"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render Helpers
    const renderHeader = () => {
        if (!job) return null;
        const banner = job.banner_url || "https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"; // Default banner

        return (
            <div className="relative h-[250px] md:h-[350px] w-full bg-slate-900 group overflow-hidden">
                <img src={banner} alt="Banner" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end p-6 md:p-12">
                    <div className="max-w-5xl mx-auto w-full">
                        <div className="flex items-center gap-4 mb-4">
                            {company?.logo_url && (
                                <img src={company.logo_url} alt="Logo" className="w-16 h-16 bg-white rounded-xl p-2 object-contain shadow-lg ring-1 ring-white/20" />
                            )}
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight shadow-sm text-shadow-sm">{job.title}</h1>
                        </div>
                        <div className="flex flex-wrap gap-4 text-white/90 text-sm md:text-base font-medium">
                            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {company?.company_name || "LYHU Careers"}</span>
                            <span className="flex items-center gap-2 text-white/40">•</span>
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.location}</span>
                            {source !== "Direct Link" && (
                                <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded text-xs ml-2 border border-white/10">Ref: {source}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center border border-slate-100">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-green-50">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Ứng tuyển thành công!</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        Cảm ơn bạn đã quan tâm đến LYHU. Hồ sơ của bạn đã được ghi nhận và bộ phận tuyển dụng sẽ liên hệ sớm nhất.
                    </p>
                    <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 w-full">
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 font-sans pb-20">
            {/* Header / Brand */}
            <div className="bg-white border-b border-slate-200/60 sticky top-0 z-20 backdrop-blur-md bg-white/90">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="font-bold text-xl text-primary-600 tracking-tight flex items-center gap-2">
                        <Briefcase className="w-6 h-6" />
                        LYHU CAREER
                    </div>
                    {job && (
                        <div className="text-sm text-slate-500 hidden sm:block">
                            Đang xem: <span className="font-medium text-slate-900">{job.title}</span>
                        </div>
                    )}
                </div>
            </div>

            {renderHeader()}

            <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: JOB DETAILS & INFO (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Job Details Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
                        {job ? (
                            <>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">{job.title}</h1>

                                <div className="flex flex-wrap gap-3 text-sm text-slate-700 mb-8">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                                        <Briefcase className="w-4 h-4 text-slate-500" />
                                        <span>Toàn thời gian</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                                        <MapPin className="w-4 h-4 text-slate-500" />
                                        <span>{job.location || 'Hồ Chí Minh'}</span>
                                    </div>
                                    {source !== "Direct Link" && (
                                        <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                                            Nguồn: {source}
                                        </div>
                                    )}
                                </div>

                                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
                                    <h3 className="text-xl">Mô tả công việc</h3>
                                    <div className="whitespace-pre-wrap mb-8">
                                        {job.description || "Chưa có mô tả chi tiết."}
                                    </div>

                                    <h3 className="text-xl">Yêu cầu ứng viên</h3>
                                    <div className="whitespace-pre-wrap mb-8">
                                        {job.requirements || "Chưa có yêu cầu chi tiết."}
                                    </div>

                                    {job.benefits && (
                                        <>
                                            <h3 className="text-xl">Quyền lợi</h3>
                                            <div className="whitespace-pre-wrap mb-8">
                                                {job.benefits}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Company Info Card */}
                    {company && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
                            <h2 className="text-xl font-bold text-slate-900 pb-4 border-b border-slate-100 mb-6 flex items-center gap-2">
                                <span className="bg-primary-100 p-2 rounded-lg text-primary-600"><Briefcase className="w-5 h-5" /></span>
                                Về {company.company_name}
                            </h2>

                            {company.description && (
                                <div className="prose prose-slate max-w-none prose-p:text-slate-600 mb-8">
                                    <div className="whitespace-pre-wrap">{company.description}</div>
                                </div>
                            )}

                            {(company.culture_description || (company.culture_images && company.culture_images.length > 0)) && (
                                <div className="space-y-6">
                                    {company.culture_description && (
                                        <div className="prose prose-slate max-w-none prose-p:text-slate-600">
                                            <h3 className="text-lg font-bold text-slate-900">Văn hóa doanh nghiệp</h3>
                                            <div className="whitespace-pre-wrap">{company.culture_description}</div>
                                        </div>
                                    )}

                                    {company.culture_images && company.culture_images.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            {company.culture_images.map((img, idx) => (
                                                <div key={idx} className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                                    <img
                                                        src={img}
                                                        alt={`Culture ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: FORM (4 cols) */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-4">
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden ring-1 ring-slate-900/5">
                            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
                                <h2 className="text-lg font-bold text-white">Ứng tuyển ngay</h2>
                                <p className="text-primary-100 text-sm mt-1">Điền thông tin để bắt đầu hành trình mới</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Họ và tên <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Số điện thoại <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        required
                                        pattern="[0-9]{10,11}"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                        placeholder="Ví dụ: 0912..."
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Email (nếu có)</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                {/* CV Upload */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">CV đính kèm (PDF/Ảnh)</label>
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative group ${selectedFile ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'}`}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />

                                        {selectedFile ? (
                                            <div className="relative z-20 flex flex-col items-center">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-primary-600">
                                                    <FileUp className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-medium text-primary-700 truncate max-w-full px-2 block">{selectedFile.name}</span>
                                                <p className="text-xs text-primary-500 mt-1">Đã chọn file</p>
                                            </div>
                                        ) : (
                                            <div className="relative z-20 flex flex-col items-center">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400 group-hover:bg-white group-hover:text-primary-500 transition-colors shadow-sm">
                                                    <Upload className="w-5 h-5" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-600">Chạm để tải file</p>
                                                <p className="text-xs text-slate-400 mt-1">PDF, DOC, Ảnh (Max 5MB)</p>
                                            </div>
                                        )}
                                    </div>
                                    {selectedFile && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFile(null)}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 justify-end px-1"
                                        >
                                            <X className="w-3 h-3" /> Bỏ chọn
                                        </button>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Đang gửi...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Nộp hồ sơ ngay
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-slate-400">
                                Bằng việc nộp hồ sơ, bạn đồng ý với chính sách bảo mật của chúng tôi.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
