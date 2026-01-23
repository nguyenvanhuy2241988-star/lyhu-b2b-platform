"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import {
    Globe,
    Play,
    RefreshCw,
    List,
    ExternalLink,
    Loader2,
    CheckCircle2,
    XCircle,
    UserPlus,
    X,
    Save
} from "lucide-react";
import { createDeal } from "@/lib/crmDealsStore";

interface ScrapeJob {
    id: string;
    created_at: string;
    target_url: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result_count: number;
    processed_count: number;
}

interface ScrapeResult {
    id: string;
    facebook_name: string;
    phone: string;
    content: string;
    post_url: string;
    is_saved: boolean;
}

export default function MarketingScraperPage() {
    const { user, session } = useAuth();
    const [targetUrl, setTargetUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [jobs, setJobs] = useState<ScrapeJob[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal State
    const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
    const [results, setResults] = useState<ScrapeResult[]>([]);
    const [isLoadingResults, setIsLoadingResults] = useState(false);
    const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setIsRefreshing(true);
        try {
            // Trigger sync for running jobs before fetching
            await fetch('/api/marketing/scrape/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            }).catch(e => console.error("Sync error:", e));

            const { data, error } = await supabase
                .from('marketing_scrape_jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJobs(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải lịch sử quét");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleStartScrape = async () => {
        if (!targetUrl) {
            toast.error("Vui lòng nhập Link Group hoặc bài viết");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/marketing/scrape/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_url: targetUrl })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Lỗi khởi tạo job");
            }

            toast.success("Đã gửi yêu cầu quét thành công!");
            setTargetUrl("");
            fetchJobs(); // Reload list

            // Auto sync after 2 seconds for demo purpose
            setTimeout(() => {
                fetch('/api/marketing/scrape/sync', {
                    method: 'POST',
                    body: JSON.stringify({ job_id: result.job_id })
                }).then(() => fetchJobs());
            }, 2000);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewResults = async (job: ScrapeJob) => {
        setSelectedJob(job);
        setIsLoadingResults(true);
        setResults([]);
        setSelectedResults(new Set());

        try {
            const res = await fetch(`/api/marketing/scrape/results?job_id=${job.id}`);
            const data = await res.json();
            if (data.results) {
                setResults(data.results);
                // Auto select all valid phones
                const validIds = data.results.filter((r: any) => r.phone).map((r: any) => r.id);
                setSelectedResults(new Set(validIds));
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải kết quả");
        } finally {
            setIsLoadingResults(false);
        }
    };

    const handleSaveToCRM = async () => {
        if (selectedResults.size === 0) return;
        setIsSaving(true);

        let successCount = 0;
        const itemsToSave = results.filter(r => selectedResults.has(r.id));

        try {
            for (const item of itemsToSave) {
                const dealData = {
                    title: `FB: ${item.facebook_name}`,
                    stage: 'new_data' as const,
                    priority: 'normal' as const,
                    source_category: 'MARKETING',
                    source: 'data_moi' as const,
                    source_detail: 'FACEBOOK_SCAN',
                    note: `Nội dung: ${item.content}\nLink: ${item.post_url}`,
                    expected_value: 0
                };

                // Create Customer First
                const customerPayload: any = {
                    name: item.facebook_name,
                    phone: item.phone,
                    source_category: 'MARKETING'
                };
                if (user?.id) {
                    customerPayload.owner_user_id = user.id;
                }

                const { data: customer, error: custError } = await supabase
                    .from('customers')
                    .insert(customerPayload)
                    .select()
                    .single();

                if (customer && user?.id) {
                    await createDeal({
                        ...dealData,
                        customer_id: customer.id,
                        owner_user_id: user.id
                    }, session?.access_token);
                    successCount++;
                }
            }

            toast.success(`Đã lưu ${successCount} khách hàng vào CRM`);
            setSelectedJob(null); // Close modal
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi lưu vào CRM");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedResults);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedResults(newSet);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'failed': return 'text-red-600 bg-red-100';
            case 'running': return 'text-blue-600 bg-blue-100';
            default: return 'text-yellow-600 bg-yellow-100';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Hoàn thành';
            case 'failed': return 'Thất bại';
            case 'running': return 'Đang chạy';
            case 'pending': return 'Đang chờ';
            default: return status;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Globe className="w-8 h-8 text-blue-600" />
                        Quét Data Facebook
                    </h1>
                    <p className="text-slate-500 mt-1">Quét số điện thoại từ Group và Bài viết Facebook (Sử dụng Apify)</p>
                </div>
            </div>

            {/* Tool Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Play className="w-5 h-5 text-blue-500" />
                    Công cụ quét
                </h2>

                <div className="flex gap-4 items-start">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Dán Link Facebook Group hoặc Post vào đây (Ví dụ: https://www.facebook.com/groups/Example)..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-2">
                            * Hỗ trợ quét bài viết mới nhất trong Group hoặc Comment của một bài viết cụ thể.
                        </p>
                    </div>
                    <button
                        onClick={handleStartScrape}
                        disabled={isLoading || !targetUrl}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        Bắt đầu Quét
                    </button>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <List className="w-5 h-5 text-slate-500" />
                        Lịch sử & Kết quả
                    </h2>
                    <button
                        onClick={fetchJobs}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200 text-left">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Ngày tạo</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Target (Link)</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Trạng thái</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-center">Kết quả</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-center">SĐT Lọc được</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        Chưa có lịch sử quét nào. Hãy thử chạy một job mới!
                                    </td>
                                </tr>
                            ) : (
                                jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(job.created_at).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-blue-600">
                                            <a href={job.target_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline truncate max-w-[200px] block">
                                                {job.target_url}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                {getStatusLabel(job.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center font-medium">
                                            {job.result_count} items
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center font-bold text-green-600">
                                            {job.processed_count}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {job.status === 'completed' && job.result_count > 0 && (
                                                <button
                                                    onClick={() => handleViewResults(job)}
                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 justify-end ml-auto">
                                                    <UserPlus className="w-4 h-4" />
                                                    Xem & Lưu CRM
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Results Modal */}
            {selectedJob && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Kết quả quét: {selectedJob.processed_count} SĐT tìm thấy</h3>
                            <button onClick={() => setSelectedJob(null)} className="p-1 hover:bg-slate-100 rounded-full">
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {isLoadingResults ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 w-10">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedResults(new Set(results.map(r => r.id)));
                                                        else setSelectedResults(new Set());
                                                    }}
                                                    checked={results.length > 0 && selectedResults.size === results.length}
                                                />
                                            </th>
                                            <th className="px-4 py-2 text-left text-sm font-semibold">Tên Facebook</th>
                                            <th className="px-4 py-2 text-left text-sm font-semibold">SĐT</th>
                                            <th className="px-4 py-2 text-left text-sm font-semibold">Nội dung</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-sm">
                                        {results.map((r) => (
                                            <tr key={r.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedResults.has(r.id)}
                                                        onChange={() => toggleSelection(r.id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 font-medium">{r.facebook_name}</td>
                                                <td className="px-4 py-2 text-green-600 font-bold">{r.phone}</td>
                                                <td className="px-4 py-2 text-slate-600 truncate max-w-[300px]" title={r.content}>{r.content}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-4 border-t bg-slate-50 flex justify-between items-center rounded-b-xl">
                            <span className="text-sm text-slate-600">Đã chọn: {selectedResults.size}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-colors"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleSaveToCRM}
                                    disabled={isSaving || selectedResults.size === 0}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu vào CRM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
