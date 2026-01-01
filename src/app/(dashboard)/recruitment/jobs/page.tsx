'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, DollarSign, Users, Briefcase } from 'lucide-react';
import { getJobs, createJob, RecruitmentJob } from '@/lib/recruitmentStore';
import { format } from 'date-fns';

export default function JobsPage() {
    const [jobs, setJobs] = useState<RecruitmentJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form State
    const [newJob, setNewJob] = useState<Partial<RecruitmentJob>>({
        title: '',
        department: '',
        location: 'Hồ Chí Minh',
        salary_range: '',
        status: 'open',
        description: ''
    });

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createJob(newJob);
            setShowCreateModal(false);
            loadData();
            setNewJob({ title: '', department: '', location: 'HCM', salary_range: '', status: 'open' });
        } catch (error) {
            alert('Lỗi tạo tin tuyển dụng');
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
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Tạo tin mới
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Đang tải...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group cursor-pointer relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.status === 'open' ? 'bg-green-100 text-green-700' :
                                        job.status === 'draft' ? 'bg-slate-100 text-slate-700' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {job.status === 'open' ? 'Đang tuyển' : job.status === 'draft' ? 'Nháp' : 'Đã đóng'}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-1">{job.title}</h3>
                            <p className="text-slate-500 text-sm mb-4">{job.department}</p>

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
                                <span>{format(new Date(job.created_at), 'dd/MM/yyyy')}</span>
                                <span className="text-blue-600 font-medium group-hover:underline">Chi tiết →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Simple Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Tạo tin tuyển dụng mới</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Vị trí</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2"
                                    required
                                    value={newJob.title}
                                    onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phòng ban</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={newJob.department}
                                        onChange={e => setNewJob({ ...newJob, department: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mức lương</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={newJob.salary_range}
                                        placeholder="VD: 10 - 15 triệu"
                                        onChange={e => setNewJob({ ...newJob, salary_range: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Tạo mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
