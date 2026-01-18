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
    benefits?: string; // New field
};

export default function ApplyPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const jobId = params.jobId as string;
    const source = searchParams.get("source") || "Direct Link";

    const [job, setJob] = useState<PublicJob | null>(null);
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
        const fetchJob = async () => {
            if (!jobId) return;
            const supabase = createClient();
            
            const { data, error } = await supabase
                .from('recruitment_jobs')
                .select('id, title, location, status, description, requirements, benefits')
                .eq('id', jobId)
                .single();

            if (data) {
                setJob(data);
            } else {
                console.warn("Could not fetch job:", error);
            }
            setIsLoading(false);
        };
        fetchJob();
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
                <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-lg text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Ứng tuyển thành công!</h2>
                    <p className="text-slate-600 mb-6">
                        Cảm ơn bạn đã quan tâm đến LYHU. Bộ phận tuyển dụng sẽ liên hệ với bạn sớm nhất có thể.
                    </p>
                    <Link href="/" className="inline-block px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* Header / Brand */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="font-bold text-xl text-primary-600 tracking-tight">LYHU CAREER</div>
                    {job && (
                        <div className="text-sm text-slate-500 hidden sm:block">
                            <span className="font-medium text-slate-900">{job.title}</span>
                        </div>
                    )}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: JOB DETAILS (RICH CONTENT) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                        {job ? (
                            <>
                                <h1 className="text-3xl font-bold text-slate-900 mb-4">{job.title}</h1>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-8 pb-6 border-b border-slate-100">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full">
                                        <Briefcase className="w-4 h-4 text-slate-500" />
                                        <span>Toàn thời gian</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full">
                                        <MapPin className="w-4 h-4 text-slate-500" />
                                        <span>{job.location || 'Hồ Chí Minh'}</span>
                                    </div>
                                    {source !== "Direct Link" && (
                                        <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                            Ref: {source}
                                        </div>
                                    )}
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Mô tả công việc</h3>
                                    <div className="whitespace-pre-wrap text-slate-600 mb-6 leading-relaxed">
                                        {job.description || "Chưa có mô tả chi tiết."}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Yêu cầu ứng viên</h3>
                                    <div className="whitespace-pre-wrap text-slate-600 mb-6 leading-relaxed">
                                        {job.requirements || "Chưa có yêu cầu chi tiết."}
                                    </div>

                                    {job.benefits && (
                                        <>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">Quyền lợi</h3>
                                            <div className="whitespace-pre-wrap text-slate-600 mb-6 leading-relaxed">
                                                {job.benefits}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">Đang tải...</div>
                        )}
                    </div>
                </div>

                {/* RIGHT: APPLICATION FORM (STICKY) */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-lg border border-primary-100 overflow-hidden sticky top-24">
                        <div className="bg-primary-600 px-6 py-4">
                            <h2 className="text-lg font-bold text-white">Ứng tuyển ngay</h2>
                            <p className="text-sm text-primary-100 opacity-90">Điền thông tin bên dưới để nộp hồ sơ</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                                    placeholder="Nguyễn Văn A"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10,11}"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                                    placeholder="0912..."
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            {/* CV Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">CV / Hồ sơ (PDF, Ảnh)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors relative">
                                    <input 
                                        type="file" 
                                        accept=".pdf,.doc,.docx,.jpg,.png"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {selectedFile ? (
                                        <div className="flex items-center justify-center gap-2 text-primary-700 font-medium">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedFile(null);
                                                }}
                                                className="z-10 p-1 hover:bg-red-100 rounded-full text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Upload className="w-6 h-6 mx-auto text-slate-400" />
                                            <p className="text-sm text-slate-500">Chạm để tải file lên</p>
                                            <p className="text-[10px] text-slate-400">PDF, DOC, Ảnh (Max 5MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang tải lên & Gửi...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Nộp hồ sơ
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
