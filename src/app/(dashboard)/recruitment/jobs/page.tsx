'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, DollarSign, Users, Briefcase, Edit } from 'lucide-react';
import { getJobs, createJob, RecruitmentJob } from '@/lib/recruitmentStore';
import Link from 'next/link';
import { format } from 'date-fns';

export default function JobsPage() {
    const [jobs, setJobs] = useState<RecruitmentJob[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getJobs();
            setJobs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tin tuyển dụng</h1>
                    <p className="text-slate-500">Quản lý các vị trí đang mở</p>
                </div>
                <Link
                    href="/recruitment/jobs/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Tạo tin mới
                </Link>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Đang tải...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group cursor-pointer relative">
                            <div className="flex justify-between items-start mb-4">
                                <Link href={`/recruitment/jobs/${job.id}`} className="block flex-1 group-hover:text-blue-600">
                                    <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{job.title}</h3>
                                    <p className="text-slate-500 text-sm">{job.department}</p>
                                </Link>

                                <div className="flex items-center gap-2 pl-2">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${job.status === 'open' ? 'bg-green-100 text-green-700' :
                                        job.status === 'draft' ? 'bg-slate-100 text-slate-700' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {job.status}
                                    </span>
                                    <Link
                                        href={`/recruitment/jobs/${job.id}/edit`}
                                        onClick={e => e.stopPropagation()} // Prevent card click
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    {job.location}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <DollarSign className="w-4 h-4 text-slate-400" />
                                    {job.salary_range || 'Thỏa thuận'}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                                <span>{job.created_at ? format(new Date(job.created_at), 'dd/MM/yyyy') : '-'}</span>
                                <Link
                                    href={`/recruitment/jobs/${job.id}`}
                                    className="text-blue-600 font-medium group-hover:underline flex items-center gap-1 hover:gap-2 transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Chi tiết →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}


        </div>
    );
}
