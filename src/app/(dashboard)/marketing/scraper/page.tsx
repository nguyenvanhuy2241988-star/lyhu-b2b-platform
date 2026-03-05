"use client";

import React, { useState, useEffect, useMemo } from "react";
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
    Save,
    MapPin,
    Facebook,
    Search,
    Filter,
    Phone
} from "lucide-react";
import { createDeal } from "@/lib/crmDealsStore";

interface ScrapeJob {
    id: string;
    created_at: string;
    target_url: string;
    keywords?: string;
    job_type: 'fb_group' | 'fb_page' | 'google_maps';
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
    // Business specific
    address?: string;
    website?: string;
    is_saved: boolean;
}

type JobType = 'fb_group' | 'fb_page' | 'google_maps';

export default function MarketingScraperPage() {
    const { user, session } = useAuth();

    // Form State
    const [jobType, setJobType] = useState<JobType>('fb_group');
    const [targetUrl, setTargetUrl] = useState("");
    const [keywords, setKeywords] = useState("");
    const [limit, setLimit] = useState(50);

    const [isLoading, setIsLoading] = useState(false);
    const [jobs, setJobs] = useState<ScrapeJob[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal State
    const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
    const [results, setResults] = useState<ScrapeResult[]>([]);
    const [isLoadingResults, setIsLoadingResults] = useState(false);
    const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Filter state for results modal
    const [resultSearch, setResultSearch] = useState("");
    const [filterHasPhone, setFilterHasPhone] = useState(false);
    const [filterKeyword, setFilterKeyword] = useState("");

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
        if (jobType === 'google_maps' && !keywords) {
            toast.error("Vui lòng nhập từ khóa tìm kiếm");
            return;
        }
        if ((jobType === 'fb_group' || jobType === 'fb_page') && !targetUrl) {
            toast.error("Vui lòng nhập đường dẫn (URL)");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                job_type: jobType,
                target_url: targetUrl,
                keywords: keywords,
                limit: limit
            };

            const response = await fetch('/api/marketing/scrape/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Lỗi khởi tạo job");
            }

            toast.success("Đã gửi yêu cầu quét thành công!");
            setTargetUrl("");
            setKeywords("");
            fetchJobs(); // Reload list

            // Auto sync after 3 seconds for demo purpose
            setTimeout(() => {
                fetch('/api/marketing/scrape/sync', {
                    method: 'POST',
                    body: JSON.stringify({ job_id: result.job_id })
                }).then(() => fetchJobs());
            }, 3000);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Filtered results memo
    const filteredResults = useMemo(() => {
        let filtered = results;
        if (resultSearch) {
            const q = resultSearch.toLowerCase();
            filtered = filtered.filter(r =>
                r.facebook_name?.toLowerCase().includes(q) ||
                r.phone?.includes(q) ||
                r.content?.toLowerCase().includes(q) ||
                r.address?.toLowerCase().includes(q)
            );
        }
        if (filterHasPhone) {
            filtered = filtered.filter(r => r.phone && r.phone !== 'N/A' && r.phone.trim() !== '');
        }
        if (filterKeyword) {
            const kw = filterKeyword.toLowerCase();
            filtered = filtered.filter(r => r.content?.toLowerCase().includes(kw));
        }
        return filtered;
    }, [results, resultSearch, filterHasPhone, filterKeyword]);

    const handleViewResults = async (job: ScrapeJob) => {
        setSelectedJob(job);
        setIsLoadingResults(true);
        setResults([]);
        setSelectedResults(new Set());
        setResultSearch("");
        setFilterHasPhone(false);
        setFilterKeyword("");

        try {
            const res = await fetch(`/api/marketing/scrape/results?job_id=${job.id}`);
            const data = await res.json();
            if (data.results) {
                setResults(data.results);
                // Auto select all valid entries (phones or just valid items)
                const validIds = data.results.map((r: any) => r.id);
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
                    title: item.address ? `MAPS: ${item.facebook_name}` : `FB: ${item.facebook_name}`,
                    stage: 'new_data' as const,
                    priority: 'normal' as const,
                    source_category: 'MARKETING',
                    source: 'data_moi' as const,
                    source_detail: selectedJob?.job_type === 'google_maps' ? 'GOOGLE_MAPS' : 'FACEBOOK_SCAN',
                    note: `Nội dung: ${item.content}\nLink/Web: ${item.post_url || item.website || ''}`,
                    expected_value: 0
                };

                // Create Customer First
                const customerPayload: any = {
                    name: item.facebook_name,
                    phone: item.phone,
                    address: item.address, // Added Address
                    website: item.website,  // Added Website
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

    const getJobIcon = (type: string) => {
        switch (type) {
            case 'google_maps': return <MapPin className="w-4 h-4 text-red-500" />;
            case 'fb_page': return <Globe className="w-4 h-4 text-blue-600" />;
            default: return <Facebook className="w-4 h-4 text-blue-600" />;
        }
    }

    const getJobLabel = (type: string) => {
        switch (type) {
            case 'google_maps': return 'Google Maps';
            case 'fb_page': return 'FB Page/Ads';
            default: return 'FB Group';
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Globe className="w-8 h-8 text-blue-600" />
                        Quét Data Đa Kênh
                    </h1>
                    <p className="text-slate-500 mt-1">Hệ thống quét dữ liệu từ Facebook & Google Maps</p>
                </div>
            </div>

            {/* Tool Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setJobType('fb_group')}
                        className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${jobType === 'fb_group' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Facebook className="w-4 h-4" /> Facebook Group
                    </button>
                    <button
                        onClick={() => setJobType('fb_page')}
                        className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${jobType === 'fb_page' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Globe className="w-4 h-4" /> Facebook Page/Ads
                    </button>
                    <button
                        onClick={() => setJobType('google_maps')}
                        className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${jobType === 'google_maps' ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <MapPin className="w-4 h-4" /> Google Maps
                    </button>
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {jobType === 'google_maps' ? <Search className="w-5 h-5 text-red-500" /> : <Play className="w-5 h-5 text-blue-500" />}
                        {jobType === 'google_maps' ? 'Nhập từ khóa tìm kiếm' : 'Nhập đường dẫn cần quét'}
                    </h2>

                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                            {jobType === 'google_maps' ? (
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: Tạp hóa tại Cầu Giấy, Spa tại Hà Nội..."
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400 mt-2">* Nhập từ khóa để tìm kiếm địa điểm kinh doanh.</p>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        type="text"
                                        placeholder={jobType === 'fb_page' ? "Link Fanpage hoặc Link Bài Viết..." : "Link Facebook Group..."}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        value={targetUrl}
                                        onChange={(e) => setTargetUrl(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        {jobType === 'fb_page' ? '* Link bài viết để quét comment, Link Page để quét bài viết mới.' : '* Hỗ trợ quét bài viết mới trong Group.'}
                                    </p>
                                </div>
                            )}

                            {/* Limit Input */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600 font-medium">Số lượng tối đa:</label>
                                <select
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="border border-slate-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={20}>20 kết quả</option>
                                    <option value={50}>50 kết quả</option>
                                    <option value={100}>100 kết quả</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleStartScrape}
                            disabled={isLoading || (jobType === 'google_maps' ? !keywords : !targetUrl)}
                            className={`px-6 py-3 text-white font-medium rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${jobType === 'google_maps' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                            Bắt đầu
                        </button>
                    </div>
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
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Loại</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Mục tiêu</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Trạng thái</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-center">Kết quả</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-center">Đã xử lý</th>
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
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                            <div className="flex items-center gap-2">
                                                {getJobIcon(job.job_type)}
                                                {getJobLabel(job.job_type)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-blue-600">
                                            {job.job_type === 'google_maps' ? (
                                                <span className="font-semibold text-slate-700">{job.keywords}</span>
                                            ) : (
                                                <a href={job.target_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline truncate max-w-[200px] block">
                                                    {job.target_url}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                {getStatusLabel(job.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center font-medium">
                                            {job.result_count}
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
                                                    Xem & Lưu
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">
                        <div className="p-4 border-b">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {getJobIcon(selectedJob.job_type)}
                                    Kết quả: {filteredResults.length}/{results.length} mục
                                </h3>
                                <button onClick={() => setSelectedJob(null)} className="p-1 hover:bg-slate-100 rounded-full">
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>
                            {/* Filter Bar */}
                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="flex-1 min-w-[200px] relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tên, SĐT, nội dung..."
                                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={resultSearch}
                                        onChange={e => setResultSearch(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => setFilterHasPhone(!filterHasPhone)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 border transition-colors ${filterHasPhone
                                            ? 'bg-green-50 border-green-300 text-green-700'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    Có SĐT
                                </button>
                                <div className="relative min-w-[180px]">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Lọc theo từ khóa nội dung..."
                                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={filterKeyword}
                                        onChange={e => setFilterKeyword(e.target.value)}
                                    />
                                </div>
                                {(resultSearch || filterHasPhone || filterKeyword) && (
                                    <button
                                        onClick={() => { setResultSearch(""); setFilterHasPhone(false); setFilterKeyword(""); }}
                                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {isLoadingResults ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedResults(new Set(filteredResults.map(r => r.id)));
                                                        else setSelectedResults(new Set());
                                                    }}
                                                    checked={filteredResults.length > 0 && filteredResults.every(r => selectedResults.has(r.id))}
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Tên (Facebook/Địa điểm)</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">SĐT</th>
                                            {selectedJob.job_type === 'google_maps' ? (
                                                <>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold">Địa chỉ</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold">Website</th>
                                                </>
                                            ) : (
                                                <th className="px-4 py-3 text-left text-sm font-semibold">Nội dung / Comment</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-sm">
                                        {filteredResults.map((r) => (
                                            <tr key={r.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedResults.has(r.id)}
                                                        onChange={() => toggleSelection(r.id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 font-medium">{r.facebook_name}</td>
                                                <td className="px-4 py-2 text-green-600 font-bold">{r.phone || 'N/A'}</td>
                                                {selectedJob.job_type === 'google_maps' ? (
                                                    <>
                                                        <td className="px-4 py-2 text-slate-600 truncate max-w-[200px]" title={r.address}>{r.address}</td>
                                                        <td className="px-4 py-2 text-blue-600 truncate max-w-[150px]">
                                                            {r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="hover:underline">Website</a> : '-'}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <td className="px-4 py-2 text-slate-600 truncate max-w-[300px]" title={r.content}>{r.content}</td>
                                                )}
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
