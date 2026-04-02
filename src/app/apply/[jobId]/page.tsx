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
    salary_range?: string;
    employment_type?: string;
};

type CompanySettings = {
    company_name: string;
    logo_url: string;
    description: string;
    culture_description?: string;
    culture_images: string[];
};

// LYHU Brand Colors
const BRAND = {
    teal: '#0d9488',      // primary-600 (teal-600)
    tealDark: '#0f766e',  // primary-700
    tealLight: '#ccfbf1',  // teal-100
    tealBg: '#f0fdfa',    // teal-50
};

export default function ApplyPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const jobId = params.jobId as string;
    const source = searchParams.get("source") || "Direct Link";
    const trackingCode = searchParams.get("tracking_code") || null;

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
    const [showFullCompanyInfo, setShowFullCompanyInfo] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!jobId) return;
            const supabase = createClient();

            const jobReq = supabase
                .from('recruitment_jobs')
                .select('id, title, location, status, description, requirements, benefits, banner_url, salary_range, employment_type')
                .eq('id', jobId)
                .single();

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
            if (file.size > 15 * 1024 * 1024) {
                alert("File quá lớn! Vui lòng chọn file dưới 15MB.");
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

            if (selectedFile) {
                const url = await uploadCV(selectedFile);
                if (!url) {
                    setIsSubmitting(false);
                    return;
                }
                cvUrl = url;
            }

            const supabase = createClient();

            const { error: rpcError } = await supabase.rpc('submit_application', {
                p_job_id: jobId,
                p_full_name: formData.full_name,
                p_email: formData.email,
                p_phone: formData.phone,
                p_cv_url: cvUrl,
                p_source: source,
                p_tracking_code: trackingCode
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: BRAND.teal }} />
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-4">
                <div className="max-w-md w-full p-8 text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: BRAND.tealBg, color: BRAND.teal }}>
                        <CheckCircle className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Ứng tuyển thành công!</h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                        Cảm ơn bạn đã quan tâm đến {company?.company_name || 'LYHU'}. Hồ sơ của bạn đã được ghi nhận và bộ phận tuyển dụng sẽ liên hệ sớm nhất.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-2.5 text-white font-medium rounded-lg text-sm w-full transition-colors"
                        style={{ backgroundColor: BRAND.teal }}
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Header Bar — Clean, minimal */}
            <header className="border-b border-slate-100 sticky top-0 z-20 bg-white">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="font-bold text-lg tracking-tight flex items-center gap-2" style={{ color: BRAND.teal }}>
                        {company?.logo_url ? (
                            <img src={company.logo_url} alt="Logo" className="w-7 h-7 object-contain" />
                        ) : (
                            <Briefcase className="w-5 h-5" />
                        )}
                        {company?.company_name || 'LYHU CAREER'}
                    </div>
                    {job && (
                        <div className="text-xs text-slate-400 hidden sm:block">
                            Đang xem: <span className="font-medium text-slate-600">{job.title}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Banner — Solid teal or custom image */}
            {job?.banner_url ? (
                <div className="w-full h-[160px] md:h-[200px] overflow-hidden">
                    <img src={job.banner_url} alt="Banner" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-full h-[80px] md:h-[100px]" style={{ backgroundColor: BRAND.teal }} />
            )}

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: JOB DETAILS (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Job Details Card */}
                    <div className="bg-white border border-slate-100 rounded-lg p-6 md:p-8">
                        {job ? (
                            <>
                                <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">{job.title}</h1>

                                <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-6">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded border border-slate-100">
                                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                        {job.employment_type || 'Toàn thời gian'}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded border border-slate-100">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        {job.location || 'Hà Nội'}
                                    </span>
                                    {source !== "Direct Link" && (
                                        <span className="px-2.5 py-1 rounded text-xs font-medium border" style={{ backgroundColor: BRAND.tealBg, color: BRAND.teal, borderColor: BRAND.tealLight }}>
                                            Nguồn: {source}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900 mb-2">Mô tả công việc</h3>
                                        <div className="whitespace-pre-wrap">
                                            {job.description || "Chưa có mô tả chi tiết."}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900 mb-2">Yêu cầu ứng viên</h3>
                                        <div className="whitespace-pre-wrap">
                                            {job.requirements || "Chưa có yêu cầu chi tiết."}
                                        </div>
                                    </div>

                                    {job.benefits && (
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-900 mb-2">Quyền lợi</h3>
                                            <div className="whitespace-pre-wrap">
                                                {job.benefits}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Company Info Card */}
                    {company && (
                        <div className="bg-white border border-slate-100 rounded-lg p-6 md:p-8">
                            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-50 mb-4 flex items-center gap-2">
                                <span className="p-1.5 rounded" style={{ backgroundColor: BRAND.tealBg, color: BRAND.teal }}>
                                    <Briefcase className="w-4 h-4" />
                                </span>
                                Về {company.company_name}
                            </h2>

                            <div className={`relative ${!showFullCompanyInfo ? 'max-h-[180px] overflow-hidden' : ''}`}>
                                {company.description && (
                                    <div className="text-sm text-slate-600 leading-relaxed mb-4 whitespace-pre-wrap">
                                        {company.description}
                                    </div>
                                )}

                                {(company.culture_description || (company.culture_images && company.culture_images.length > 0)) && (
                                    <div className="space-y-4 pt-3 border-t border-slate-50">
                                        {company.culture_description && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">Văn hóa doanh nghiệp</h3>
                                                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{company.culture_description}</div>
                                            </div>
                                        )}

                                        {company.culture_images && company.culture_images.length > 0 && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {company.culture_images.map((img, idx) => (
                                                    <div key={idx} className="aspect-video rounded overflow-hidden bg-slate-50 border border-slate-100">
                                                        <img
                                                            src={img}
                                                            alt={`Hoạt động ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!showFullCompanyInfo && (
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                                )}
                            </div>

                            <button
                                onClick={() => setShowFullCompanyInfo(!showFullCompanyInfo)}
                                className="w-full mt-3 py-2 text-sm font-medium rounded transition-colors border"
                                style={{
                                    color: BRAND.teal,
                                    borderColor: BRAND.tealLight,
                                    backgroundColor: showFullCompanyInfo ? 'white' : BRAND.tealBg
                                }}
                            >
                                {showFullCompanyInfo ? 'Thu gọn' : 'Xem thêm về công ty'}
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT: APPLICATION FORM (4 cols) */}
                <div className="lg:col-span-4">
                    <div className="sticky top-16 space-y-3">
                        <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                            {/* Form Header */}
                            <div className="px-5 py-4" style={{ backgroundColor: BRAND.teal }}>
                                <h2 className="text-base font-bold text-white">Ứng tuyển ngay</h2>
                                <p className="text-white/80 text-xs mt-0.5">Điền thông tin để bắt đầu hành trình mới</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                {/* Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">Họ và tên <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-teal-500 outline-none text-sm text-slate-900 placeholder:text-slate-400"
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">Số điện thoại <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        required
                                        pattern="[0-9]{10,11}"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-teal-500 outline-none text-sm text-slate-900 placeholder:text-slate-400"
                                        placeholder="Ví dụ: 0912..."
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">Email (nếu có)</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-teal-500 outline-none text-sm text-slate-900 placeholder:text-slate-400"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                {/* CV Upload */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-600">CV đính kèm (PDF/Ảnh)</label>
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-5 text-center relative ${selectedFile ? 'border-teal-400 bg-teal-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />

                                        {selectedFile ? (
                                            <div className="flex flex-col items-center">
                                                <FileUp className="w-5 h-5 mb-1.5" style={{ color: BRAND.teal }} />
                                                <span className="text-xs font-medium text-slate-700 truncate max-w-full px-2 block">{selectedFile.name}</span>
                                                <p className="text-[10px] mt-0.5" style={{ color: BRAND.teal }}>Đã chọn file</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                                                <p className="text-xs font-medium text-slate-500">Chạm để tải file</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOC, Ảnh (Max 15MB)</p>
                                            </div>
                                        )}
                                    </div>
                                    {selectedFile && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFile(null)}
                                            className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-0.5 px-1"
                                        >
                                            <X className="w-3 h-3" /> Bỏ chọn
                                        </button>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-1">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-70"
                                        style={{ backgroundColor: BRAND.teal }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang gửi...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Nộp hồ sơ ngay
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <p className="text-center text-[10px] text-slate-400">
                            Bằng việc nộp hồ sơ, bạn đồng ý với chính sách bảo mật của chúng tôi.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
