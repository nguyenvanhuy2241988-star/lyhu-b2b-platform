"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecruitmentJob, RecruitmentCandidate, getJob, getCandidates, updateJob } from "@/lib/recruitmentStore";
import { Loader2, Share2, Copy, ArrowLeft, Users, Briefcase, MapPin, DollarSign, Edit, Zap, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

// Candidate Status Badge Helper
const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        new: "bg-primary-100 text-primary-700",
        screening: "bg-purple-100 text-purple-700",
        interview: "bg-yellow-100 text-yellow-700",
        offer: "bg-orange-100 text-orange-700",
        hired: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${colors[status] || "bg-slate-100 text-slate-700"}`}>
            {status}
        </span>
    );
};

export default function JobDetailPage() {
    const { jobId } = useParams();
    const router = useRouter();
    const [job, setJob] = useState<RecruitmentJob | null>(null);
    const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [source, setSource] = useState("FacebookGroup");

    // Tracking Link State
    const [generatedLink, setGeneratedLink] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const generateTrackingLink = async () => {
        if (!job) return;
        setIsGenerating(true);
        try {
            // 1. Generate short code (6 chars)
            const code = Math.random().toString(36).substring(2, 8);

            // 2. Construct Original URL
            const host = window.location.origin;
            const originalUrl = `${host}/apply/${job.id}?source=${source}&tracking_code=${code}`;

            // 3. Insert into Supabase
            const { error } = await supabase
                .from('tracking_shortlinks')
                .insert([{
                    code,
                    original_url: originalUrl,
                    campaign_source: source
                    // creator_id is auto handled by Default/RLS
                }]);

            if (error) throw error;

            // 4. Set Result
            setGeneratedLink(`${host}/go/${code}`);
            toast.success("Tạo link thành công!");
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi tạo link tracking");
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [jobId]);

    const loadData = async () => {
        if (!jobId) return;
        try {
            const [jobData, candidateData] = await Promise.all([
                getJob(jobId as string),
                getCandidates(jobId as string)
            ]);
            setJob(jobData);
            setCandidates(candidateData);
        } catch (error) {
            console.error(error);
            // toast.error("Không thể tải thông tin công việc");
        } finally {
            setIsLoading(false);
        }
    };

    const copyApplyLink = () => {
        if (!job) return;
        // Construct public apply link
        const host = window.location.origin;
        const link = `${host}/apply/${job.id}?source=${source}`;
        navigator.clipboard.writeText(link);
        alert(`Đã sao chép Link!\n\n${link}`); // Replace with toast if available
    };

    const forceDownload = async (url: string, filename: string) => {
        try {
            toast.info("Đang tải xuống...");
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            window.open(url, '_blank'); // Fallback
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-slate-700">Công việc không tồn tại</h2>
                <Link href="/recruitment/jobs" className="text-primary-600 hover:underline mt-2 inline-block">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <Link href="/recruitment/jobs" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 transition">
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                {job.status === 'open' ? 'Đang tuyển' : 'Đã đóng'}
                            </span>
                            <Link href={`/recruitment/jobs/${job.id}/edit`} className="ml-2 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition text-slate-600">
                                <Edit className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="flex flex-wrap gap-4 text-slate-600">
                            <div className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.department}</div>
                            <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</div>
                            <div className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salary_range || "Thỏa thuận"}</div>
                        </div>
                    </div>

                    {/* Share / Tracking Box */}
                    <div className="bg-primary-50 border border-primary-200 p-4 rounded-xl max-w-md w-full">
                        <h3 className="text-sm font-bold text-primary-800 mb-2 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Lấy Link Tracking (KPI Traffic)
                        </h3>

                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <select
                                    className="text-sm border-primary-200 rounded px-2 py-1 outline-none text-slate-700 bg-white"
                                    value={source}
                                    onChange={e => setSource(e.target.value)}
                                >
                                    <option value="FacebookGroup">Facebook Group</option>
                                    <option value="Threads">Threads</option>
                                    <option value="TikTok">TikTok</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Zalo">Zalo</option>
                                    <option value="Direct">Direct/Inbox</option>
                                </select>
                                <button
                                    onClick={generateTrackingLink}
                                    disabled={isGenerating}
                                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm font-medium transition flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    Tạo Link
                                </button>
                            </div>

                            {generatedLink && (
                                <div className="bg-white p-2 rounded border border-primary-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-bold">Smart Link của bạn</div>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs bg-slate-50 text-slate-600 p-1.5 rounded font-mono border border-slate-200 truncate">
                                            {generatedLink}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedLink);
                                                toast.success("Đã copy link tracking!");
                                            }}
                                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                                            title="Copy"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Hệ thống sẽ đếm CLICK khi bạn dùng link này.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Job Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Candidates Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-slate-500" />
                                Ứng viên ({candidates.length})
                            </h3>
                        </div>
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Tên & Liên hệ</th>
                                        <th className="px-6 py-3">Trạng thái</th>
                                        <th className="px-6 py-3">Nguồn</th>
                                        <th className="px-6 py-3">Ngày nộp</th>
                                        <th className="px-6 py-3">Link CV</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {candidates.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                                Chưa có ứng viên nào nộp đơn.
                                            </td>
                                        </tr>
                                    ) : (
                                        candidates.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-3">
                                                    <div className="font-medium text-slate-900">{c.full_name}</div>
                                                    <div className="text-xs text-slate-500">{c.phone} • {c.email}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <StatusBadge status={c.status} />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                                        {(c as any).source || 'Direct'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-slate-500">
                                                    {format(new Date(c.created_at), 'dd/MM/yyyy')}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {c.cv_url ? (
                                                        <button
                                                            onClick={() => forceDownload(c.cv_url!, `CV_${c.full_name.replace(/\s+/g, '_')}`)}
                                                            className="text-primary-600 hover:underline hover:text-primary-800 truncate max-w-[150px] block font-medium"
                                                        >
                                                            Tải CV
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Mobile Card List View */}
                        <div className="lg:hidden divide-y divide-slate-100">
                            {candidates.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    Chưa có ứng viên nào nộp đơn.
                                </div>
                            ) : (
                                candidates.map(c => (
                                    <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-slate-900">{c.full_name}</div>
                                            <StatusBadge status={c.status} />
                                        </div>
                                        
                                        <div className="bg-slate-50 p-3 rounded-lg space-y-2 mb-3">
                                            <div className="text-xs text-slate-600">
                                                <div className="flex items-center gap-1.5 mb-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}</div>
                                                <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{c.email}</span></div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                                    {(c as any).source || 'Direct'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {format(new Date(c.created_at), 'dd/MM')}
                                                </span>
                                            </div>
                                            <div>
                                                {c.cv_url ? (
                                                    <button
                                                        onClick={() => forceDownload(c.cv_url!, `CV_${c.full_name.replace(/\s+/g, '_')}`)}
                                                        className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2.5 py-1.5 rounded-md hover:bg-primary-100 transition-colors"
                                                    >
                                                        Tải CV
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 px-2 py-1">Không có CV</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Description & Requirements (Read only for now) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Mô tả công việc</h3>
                        <div className="text-sm text-slate-600 whitespace-pre-wrap">
                            {job.description || "Chưa có mô tả."}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Yêu cầu</h3>
                        <div className="text-sm text-slate-600 whitespace-pre-wrap">
                            {job.requirements || "Chưa có yêu cầu."}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
