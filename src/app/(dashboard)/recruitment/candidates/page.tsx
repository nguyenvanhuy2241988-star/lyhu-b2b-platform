'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Mail, Phone, MoreHorizontal, User, Calendar, Briefcase, Trash2, Settings, Upload, FileText, ExternalLink } from 'lucide-react';
import { getCandidates, getJobs, createCandidate, updateCandidate, updateCandidateStatus, deleteCandidate, getInterviewsByCandidate, uploadCandidateCV, RecruitmentCandidate, RecruitmentJob, RecruitmentInterview, RecruitmentColumn, getKanbanColumns } from '@/lib/recruitmentStore';
import CandidateDetailDrawer from './CandidateDetailDrawer';
import RecruitmentColumnManager from './RecruitmentColumnManager';
import { format } from 'date-fns';

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
    const [jobs, setJobs] = useState<RecruitmentJob[]>([]);
    const [columns, setColumns] = useState<RecruitmentColumn[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showColumnModal, setShowColumnModal] = useState(false);

    // Drag & Drop State
    const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

    // Detail Drawer State
    const [selectedCandidate, setSelectedCandidate] = useState<RecruitmentCandidate | null>(null);
    const [candidateInterviews, setCandidateInterviews] = useState<RecruitmentInterview[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [cvUploading, setCvUploading] = useState(false);

    // Form
    const [newCandidate, setNewCandidate] = useState<Partial<RecruitmentCandidate>>({
        full_name: '',
        email: '',
        phone: '',
        status: 'new',
        job_id: '',
        cv_url: '',
        notes: '',
        source: 'Referral',
        experience_years: 0,
        expected_salary: '',
        skills: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [cands, jobsData, colsData] = await Promise.all([getCandidates(), getJobs(), getKanbanColumns()]);
            setCandidates(cands);
            setJobs(jobsData);
            setColumns(colsData);
            if (jobsData.length > 0 && !newCandidate.job_id) {
                setNewCandidate(prev => ({ ...prev, job_id: jobsData[0].id })); // default job
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (newCandidate.id) {
                // Update mode
                await updateCandidate(newCandidate.id, newCandidate);
            } else {
                // Create mode
                await createCandidate(newCandidate);
            }
            setShowModal(false);
            loadData();
            // Reset form
            setNewCandidate({ full_name: '', email: '', phone: '', status: columns.length > 0 ? columns[0].id : 'new', job_id: jobs[0]?.id || '', source: 'Referral' });
        } catch (error) {
            console.error(error);
            alert('Lỗi lưu thông tin ứng viên');
        }
    };

    const handleEditClick = () => {
        if (!selectedCandidate) return;
        setNewCandidate({
            ...selectedCandidate,
            // Ensure nulls are empty strings for inputs
            experience_years: selectedCandidate.experience_years || 0,
            expected_salary: selectedCandidate.expected_salary || '',
            skills: selectedCandidate.skills || '',
            notes: selectedCandidate.notes || '',
            cv_url: selectedCandidate.cv_url || ''
        });
        setShowModal(true);
        // We can close the drawer or keep it open.
        // If we keep it open, we should probably close it to avoid clutter or re-fetch after update.
        // Let's keep it open, but we need to refresh selectedCandidate after update.
        // For simplicity, let's close drawer to force re-open with fresh data, OR just reload data.
    };

    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            // Optimistic update
            setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            await updateCandidateStatus(id, newStatus);
        } catch (error) {
            console.error(error);
            // Revert optimistic update gracefully by reloading
            loadData();
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, candidateId: string) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', candidateId);
        setDraggedCandidateId(candidateId);
    };

    const handleDragEnd = () => {
        setDraggedCandidateId(null);
        setDragOverColumnId(null);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault(); // Essential for allowing drop
        e.dataTransfer.dropEffect = 'move';
        if (dragOverColumnId !== columnId) {
            setDragOverColumnId(columnId);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverColumnId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        setDragOverColumnId(null);

        const candidateId = e.dataTransfer.getData('text/plain');
        if (candidateId) {
            const candidate = candidates.find(c => c.id === candidateId);
            // Protect against dropping in same col, or logic error
            if (candidate && candidate.status !== targetColumnId) {
                await handleStatusChange(candidateId, targetColumnId);
            }
        }
        setDraggedCandidateId(null);
    };

    const handleViewCandidate = async (candidate: RecruitmentCandidate) => {
        setSelectedCandidate(candidate);
        setDrawerOpen(true);
        // Reset interviews while fetching
        setCandidateInterviews([]);
        try {
            const interviews = await getInterviewsByCandidate(candidate.id);
            setCandidateInterviews(interviews);
        } catch (error) {
            console.error("Failed to load interviews", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa ứng viên này không? Hành động này không thể hoàn tác.')) {
            try {
                await deleteCandidate(id);
                setCandidates(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Failed to delete candidate", error);
                alert("Không thể xóa ứng viên. Vui lòng thử lại.");
            }
        }
    };

    const getCandidatesByStatus = (status: string) => candidates.filter(c => c.status === status);

    const getStatusLabel = (status: string) => columns.find(s => s.id === status)?.label || status;
    const getStatusColor = (status: string) => columns.find(s => s.id === status)?.color || 'bg-slate-50 text-slate-700';

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ứng viên</h1>
                    <p className="text-slate-500">Quản lý hồ sơ theo quy trình</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowColumnModal(true)}
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 transition font-medium text-sm border border-slate-200"
                    >
                        <Settings className="w-4 h-4" />
                        Tùy chỉnh Bảng
                    </button>
                    <div className="bg-white border p-1 rounded-lg flex text-sm font-medium">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-md transition ${viewMode === 'kanban' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Xem dạng thẻ (Kanban)"
                        >
                            <MoreHorizontal className="w-5 h-5 rotate-90" /> {/* LayoutGrid fallback */}
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Xem dạng danh sách"
                        >
                            <User className="w-5 h-5" /> {/* List fallback */}
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setNewCandidate({
                                full_name: '', email: '', phone: '', status: columns.length > 0 ? columns[0].id : 'new', job_id: jobs[0]?.id || '', source: 'Referral',
                                experience_years: 0, expected_salary: '', skills: '', notes: ''
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm ứng viên
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div>Đang tải...</div>
            ) : viewMode === 'kanban' ? (
                // KANBAN VIEW
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-6 h-full min-w-[1200px]">
                        {columns.map(col => (
                            <div
                                key={col.id}
                                className="w-80 flex flex-col h-full"
                                onDragOver={(e) => handleDragOver(e, col.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className={`flex items-center justify-between p-3 rounded-t-xl border-b-2 font-semibold ${col.color.replace('text', 'border')}`}>
                                    <span className={col.color.split(' ')[1]}>{col.label}</span>
                                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs">
                                        {getCandidatesByStatus(col.id).length}
                                    </span>
                                </div>
                                <div className={`bg-slate-50/50 flex-1 p-3 space-y-3 overflow-y-auto rounded-b-xl border transition-all duration-200 ${dragOverColumnId === col.id ? 'border-primary-400 border-dashed bg-primary-50/30 ring-2 ring-primary-100 ring-inset' : 'border-slate-200'}`}>
                                    {getCandidatesByStatus(col.id).map(cand => (
                                        <div
                                            key={cand.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, cand.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition group cursor-grab active:cursor-grabbing ${draggedCandidateId === cand.id ? 'opacity-50 border-primary-400 rotate-2 scale-105 z-50 relative' : 'border-slate-100'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4
                                                    className="font-semibold text-slate-800 cursor-pointer hover:text-primary-600"
                                                    onClick={() => handleViewCandidate(cand)}
                                                >
                                                    {cand.full_name}
                                                </h4>
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
                                                className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 cursor-pointer outline-none focus:border-primary-300"
                                                value={cand.status}
                                                onChange={(e) => handleStatusChange(cand.id, e.target.value)}
                                            >
                                                {columns.map(s => (
                                                    <option key={s.id} value={s.id}>{s.label}</option>
                                                ))}
                                            </select>

                                            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDelete(cand.id)}
                                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                                    title="Xóa ứng viên"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <Link
                                                    href={`/recruitment/interviews?candidateId=${cand.id}`}
                                                    className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium px-2 py-1 hover:bg-primary-50 rounded transition"
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
            ) : (
                // LIST VIEW
                <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-slate-200">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Ứng viên</th>
                                <th className="px-6 py-4">Vị trí</th>
                                <th className="px-6 py-4">Liên hệ</th>
                                <th className="px-6 py-4">Nguồn</th>
                                <th className="px-6 py-4">Tracking</th>
                                <th className="px-6 py-4">Ngày nộp</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {candidates.map(cand => (
                                <tr key={cand.id} className="hover:bg-slate-50 transition">
                                    <td
                                        className="px-6 py-4 font-medium text-slate-900 cursor-pointer hover:text-primary-600"
                                        onClick={() => handleViewCandidate(cand)}
                                    >
                                        {cand.full_name}
                                    </td>
                                    <td className="px-6 py-4">{cand.job?.title || '-'}</td>
                                    <td className="px-6 py-4 space-y-1">
                                        <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {cand.email}</div>
                                        <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {cand.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {cand.source ? <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{cand.source}</span> : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {cand.tracking_code ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-mono font-medium">#{cand.tracking_code}</span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{format(new Date(cand.created_at), 'dd/MM/yyyy')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(cand.status)}`}>
                                            {getStatusLabel(cand.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleDelete(cand.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="Xóa ứng viên"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <Link
                                                href={`/recruitment/interviews?candidateId=${cand.id}`}
                                                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium text-xs px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
                                            >
                                                <Calendar className="w-3 h-3" />
                                                Đặt lịch
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{newCandidate.id ? 'Cập nhật ứng viên' : 'Thêm ứng viên mới'}</h2>
                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            {/* ... (rest of form) ... */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Họ tên <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" required
                                    value={newCandidate.full_name}
                                    onChange={e => setNewCandidate({ ...newCandidate, full_name: e.target.value })}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newCandidate.email}
                                        onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newCandidate.phone}
                                        onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                                        placeholder="0912..."
                                    />
                                </div>
                            </div>

                            {/* Job & Source */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vị trí ứng tuyển</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
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
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
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

                            {/* Details */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Kinh nghiệm</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newCandidate.experience_years || ''}
                                        onChange={e => setNewCandidate({ ...newCandidate, experience_years: e.target.value ? parseFloat(e.target.value) : 0 })}
                                        placeholder="VD: 2 năm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Lương (Mong đợi)</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newCandidate.expected_salary || ''}
                                        onChange={e => setNewCandidate({ ...newCandidate, expected_salary: e.target.value })}
                                        placeholder="VD: 15-20M"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Kỹ năng</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newCandidate.skills || ''}
                                        onChange={e => setNewCandidate({ ...newCandidate, skills: e.target.value })}
                                        placeholder="React, Node..."
                                    />
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Học vấn</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newCandidate.education || ''}
                                        onChange={e => setNewCandidate({ ...newCandidate, education: e.target.value })}
                                        placeholder="Đại học ABC..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Quê quán</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newCandidate.hometown || ''}
                                        onChange={e => setNewCandidate({ ...newCandidate, hometown: e.target.value })}
                                        placeholder="Hà Nội..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Địa chỉ thường trú</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={newCandidate.address || ''}
                                    onChange={e => setNewCandidate({ ...newCandidate, address: e.target.value })}
                                    placeholder="Số 1, Đường X, Phường Y..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ảnh CCCD (Mặt trước)</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newCandidate.id_card_front || ''}
                                        onChange={e => setNewCandidate({ ...newCandidate, id_card_front: e.target.value })}
                                        placeholder="URL ảnh..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ảnh CCCD (Mặt sau)</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newCandidate.id_card_back || ''}
                                        onChange={e => setNewCandidate({ ...newCandidate, id_card_back: e.target.value })}
                                        placeholder="URL ảnh..."
                                    />
                                </div>
                            </div>

                            {/* CV Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Tải CV ứng viên</label>
                                {newCandidate.cv_url ? (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <a href={newCandidate.cv_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:underline truncate flex-1">
                                            Xem CV đã tải lên
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setNewCandidate({ ...newCandidate, cv_url: '' })}
                                            className="text-xs text-red-500 hover:text-red-700 flex-shrink-0"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="hidden"
                                            id="cv-upload-input"
                                            disabled={cvUploading}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (file.size > 25 * 1024 * 1024) {
                                                    alert('File quá lớn. Tối đa 25MB.');
                                                    return;
                                                }
                                                try {
                                                    setCvUploading(true);
                                                    const url = await uploadCandidateCV(file);
                                                    setNewCandidate({ ...newCandidate, cv_url: url });
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Lỗi tải CV. Vui lòng thử lại.');
                                                } finally {
                                                    setCvUploading(false);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="cv-upload-input"
                                            className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg px-4 py-3 text-sm cursor-pointer transition ${cvUploading ? 'border-primary-300 bg-primary-50 text-primary-500' : 'border-slate-300 hover:border-primary-400 hover:bg-primary-50 text-slate-500 hover:text-primary-600'}`}
                                        >
                                            {cvUploading ? (
                                                <><span className="animate-spin">⏳</span> Đang tải lên...</>
                                            ) : (
                                                <><Upload className="w-4 h-4" /> Chọn file CV (PDF, DOC, ảnh - tối đa 25MB)</>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Ghi chú thêm</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none h-20"
                                    value={newCandidate.notes || ''}
                                    onChange={e => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                                    placeholder="Ghi chú về ứng viên này..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">Lưu ứng viên</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Candidate Detail Drawer */}
            {selectedCandidate && (
                <CandidateDetailDrawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    candidate={selectedCandidate}
                    interviews={candidateInterviews}
                    onEdit={handleEditClick}
                />
            )}

            <RecruitmentColumnManager
                isOpen={showColumnModal}
                onClose={() => setShowColumnModal(false)}
                onColumnsChanged={loadData}
            />
        </div>
    );
}


