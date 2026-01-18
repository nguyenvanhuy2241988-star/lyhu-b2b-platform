'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Mail, Phone, MoreHorizontal, User, Calendar } from 'lucide-react';
import { getCandidates, getJobs, createCandidate, updateCandidateStatus, RecruitmentCandidate, RecruitmentJob, CandidateStatus } from '@/lib/recruitmentStore';
import { format } from 'date-fns';

const STATUS_COLS: { id: CandidateStatus; label: string; color: string }[] = [
    { id: 'new', label: 'Mới ứng tuyển', color: 'bg-blue-50 text-blue-700' },
    { id: 'screening', label: 'Sàng lọc', color: 'bg-purple-50 text-purple-700' },
    { id: 'interview', label: 'Phỏng vấn', color: 'bg-orange-50 text-orange-700' },
    { id: 'offer', label: 'Offer', color: 'bg-yellow-50 text-yellow-700' },
    { id: 'hired', label: 'Đã tuyển', color: 'bg-green-50 text-green-700' },
    { id: 'rejected', label: 'Từ chối', color: 'bg-red-50 text-red-700' },
];

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
    const [jobs, setJobs] = useState<RecruitmentJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [newCandidate, setNewCandidate] = useState<Partial<RecruitmentCandidate>>({
        full_name: '',
        email: '',
        phone: '',
        status: 'new',
        job_id: '',
        cv_url: '',
        notes: '',
        source: 'Referral'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [cands, jobsData] = await Promise.all([getCandidates(), getJobs()]);
            setCandidates(cands);
            setJobs(jobsData);
            if (jobsData.length > 0) {
                setNewCandidate(prev => ({ ...prev, job_id: jobsData[0].id })); // default job
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createCandidate(newCandidate);
            setShowModal(false);
            loadData();
            setNewCandidate({ full_name: '', email: '', phone: '', status: 'new', job_id: jobs[0]?.id || '' });
        } catch (error) {
            alert('Lỗi thêm ứng viên');
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateCandidateStatus(id, newStatus as CandidateStatus);
            // Optimistic update or reload
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const getCandidatesByStatus = (status: string) => candidates.filter(c => c.status === status);

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ứng viên</h1>
                    <p className="text-slate-500">Quản lý hồ sơ theo quy trình</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Thêm ứng viên
                </button>
            </div>

            {/* Kanban Board */}
            {loading ? (
                <div>Đang tải...</div>
            ) : (
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-6 h-full min-w-[1200px]">
                        {STATUS_COLS.map(col => (
                            <div key={col.id} className="w-80 flex flex-col h-full">
                                <div className={`flex items-center justify-between p-3 rounded-t-xl border-b-2 font-semibold ${col.color.replace('text', 'border')}`}>
                                    <span className={col.color.split(' ')[1]}>{col.label}</span>
                                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs">
                                        {getCandidatesByStatus(col.id).length}
                                    </span>
                                </div>
                                <div className="bg-slate-50/50 flex-1 p-3 space-y-3 overflow-y-auto rounded-b-xl border border-slate-200">
                                    {getCandidatesByStatus(col.id).map(cand => (
                                        <div key={cand.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-slate-800">{cand.full_name}</h4>
                                                {/* <button className="text-slate-400 hover:text-slate-600">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button> */}
                                            </div>
                                            <div className="text-xs text-slate-500 mb-3 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-3 h-3" />
                                                    {cand.job?.title || 'Unknown Job'}
                                                </div>
                                                {cand.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3 h-3" />
                                                        {cand.email}
                                                    </div>
                                                )}
                                                {cand.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3 h-3" />
                                                        {cand.phone}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick Actions (Move Status) */}
                                            <select
                                                className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 cursor-pointer outline-none focus:border-blue-300"
                                                value={cand.status}
                                                onChange={(e) => handleStatusChange(cand.id, e.target.value)}
                                            >
                                                {STATUS_COLS.map(s => (
                                                    <option key={s.id} value={s.id}>{s.label}</option>
                                                ))}
                                            </select>

                                            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                                                <Link
                                                    href={`/recruitment/interviews?candidateId=${cand.id}`}
                                                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition"
                                                    title="Đặt lịch phỏng vấn"
                                                >
                                                    <Calendar className="w-3 h-3" />
                                                    Đặt lịch
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Thêm ứng viên mới</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Họ tên <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" required
                                    value={newCandidate.full_name}
                                    onChange={e => setNewCandidate({ ...newCandidate, full_name: e.target.value })}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCandidate.email}
                                        onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCandidate.phone}
                                        onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                                        placeholder="0912..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vị trí ứng tuyển</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCandidate.job_id}
                                        onChange={e => setNewCandidate({ ...newCandidate, job_id: e.target.value })}
                                    >
                                        {jobs.map(j => (
                                            <option key={j.id} value={j.id}>{j.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nguồn</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCandidate.source || 'Referral'}
                                        onChange={e => setNewCandidate({ ...newCandidate, source: e.target.value })}
                                    >
                                        <option value="Facebook">Facebook</option>
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="TopCV">TopCV</option>
                                        <option value="Referral">Giới thiệu</option>
                                        <option value="Direct">Trực tiếp</option>
                                        <option value="Other">Khác</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Link CV (Drive/PDF)</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newCandidate.cv_url || ''}
                                    onChange={e => setNewCandidate({ ...newCandidate, cv_url: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Ghi chú thêm</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-20"
                                    value={newCandidate.notes || ''}
                                    onChange={e => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                                    placeholder="Ghi chú về ứng viên này..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Lưu ứng viên</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Briefcase(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
    )
}
