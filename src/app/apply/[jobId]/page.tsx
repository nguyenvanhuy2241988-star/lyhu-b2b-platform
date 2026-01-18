"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient"; // Assuming standard client export
import { Loader2, CheckCircle, Send, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Define a minimal job type for this page
type PublicJob = {
    id: string;
    title: string;
    location: string;
    status: string;
};

export default function ApplyPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const jobId = params.jobId as string;
    const source = searchParams.get("source") || "Direct Link"; // Auto-capture source

    const [job, setJob] = useState<PublicJob | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        email: "",
        cv_url: "" // Optional link for now
    });

    // 1. Fetch Job Details (Public)
    useEffect(() => {
        const fetchJob = async () => {
            if (!jobId) return;
            const supabase = createClient();

            // Try to fetch job details. 
            // Note: RLS must allow 'anon' to read 'recruitment_jobs' for this to work perfectly.
            // If strict RLS is on, this might fail, so we handle that.
            const { data, error } = await supabase
                .from('recruitment_jobs')
                .select('id, title, location, status')
                .eq('id', jobId)
                .single();

            if (data) {
                setJob(data);
            } else {
                console.warn("Could not fetch job details (RLS or Invalid ID)");
            }
            setIsLoading(false);
        };
        fetchJob();
    }, [jobId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const supabase = createClient();

            // Call the Public RPC
            const { error: rpcError } = await supabase.rpc('submit_application', {
                p_job_id: jobId,
                p_full_name: formData.full_name,
                p_email: formData.email,
                p_phone: formData.phone,
                p_cv_url: formData.cv_url,
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
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header / Brand */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* You can replace this with your actual Logo Image */}
                        <div className="font-bold text-xl text-primary-600 tracking-tight">LYHU CAREER</div>
                    </div>
                    {job && (
                        <div className="hidden sm:block text-sm text-slate-500">
                            Ứng tuyển vị trí <span className="font-medium text-slate-900">{job.title}</span>
                        </div>
                    )}
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Job Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    {job ? (
                        <>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">{job.title}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                    <Briefcase className="w-4 h-4" />
                                    <span>Toàn thời gian</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{job.location || 'Hồ Chí Minh'}</span>
                                </div>
                                {source !== "Direct Link" && (
                                    <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                        Ref: {source}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <h1 className="text-xl font-bold text-slate-400">Đang tải thông tin công việc...</h1>
                        </div>
                    )}
                </div>

                {/* Application Form */}
                <div className="bg-white rounded-xl shadow-lg border border-primary-100 overflow-hidden">
                    <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
                        <h2 className="text-lg font-semibold text-primary-800">Thông tin ứng tuyển</h2>
                        <p className="text-sm text-primary-600">Vui lòng điền đầy đủ thông tin bên dưới</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="Ví dụ: Nguyễn Văn A"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>

                        {/* Contact Info Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10,11}"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="0912..."
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* CV Link */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link Hồ sơ / Portoflio / Facebook</label>
                            <input
                                type="url"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="https://..."
                                value={formData.cv_url}
                                onChange={e => setFormData({ ...formData, cv_url: e.target.value })}
                            />
                            <p className="text-xs text-slate-500 mt-1">Dán link CV online, Google Drive hoặc link Facebook cá nhân của bạn.</p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.99]"
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
                            <p className="text-center text-xs text-slate-400 mt-3">
                                Bằng việc nộp hồ sơ, bạn đồng ý để LYHU liên hệ phỏng vấn.
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
