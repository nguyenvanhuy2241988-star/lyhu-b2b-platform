"use client";

import React, { useState, useEffect } from "react";
import { format, isToday, isTomorrow, parseISO, startOfToday } from "date-fns";
import { vi } from "date-fns/locale";
import {
    Calendar, Clock, MapPin, Video, User, Plus, Search,
    CheckCircle, XCircle, AlertCircle, FileText, ChevronRight
} from "lucide-react";
import { getInterviews, getCandidates, scheduleInterview, RecruitmentInterview, RecruitmentCandidate } from "@/lib/recruitmentStore";
import { toast } from "sonner"; // Assuming sonner is used, or replace with alert/custom toast

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<RecruitmentInterview[]>([]);
    const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');

    // Form State
    const [formData, setFormData] = useState({
        candidate_id: "",
        scheduled_at: "",
        type: "online",
        location: "",
        meeting_link: "",
        notes: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [interviewsData, candidatesData] = await Promise.all([
                getInterviews(),
                getCandidates()
            ]);
            setInterviews(interviewsData);
            setCandidates(candidatesData.filter(c => c.status !== 'rejected')); // Only active candidates
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải dữ liệu");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.candidate_id || !formData.scheduled_at) {
                toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
                return;
            }

            await scheduleInterview({
                candidate_id: formData.candidate_id,
                scheduled_at: new Date(formData.scheduled_at).toISOString(),
                type: formData.type as any,
                location: formData.location,
                meeting_link: formData.meeting_link,
                // notes: formData.notes // Notes usually go to feedback or separate field? Store type doesn't have notes for interview creation yet, using feedback or adding notes col later.
                // For now, let's skip notes or put it in meeting_link/location if needed, or update store.
                // Re-checking store: It has feedback. Let's assume this is separate from 'notes' given during scheduling.
            });

            toast.success("Đã lên lịch phỏng vấn");
            setShowModal(false);
            setFormData({
                candidate_id: "",
                scheduled_at: "",
                type: "online",
                location: "",
                meeting_link: "",
                notes: ""
            });
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tạo lịch phỏng vấn");
        }
    };

    // Filter Logic
    const filteredInterviews = interviews.filter(i => {
        if (filter === 'upcoming') {
            return new Date(i.scheduled_at) >= new Date();
        }
        return true;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200'; // scheduled
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return 'Sắp tới';
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Đang tải lịch phỏng vấn...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        Lịch Phỏng Vấn
                    </h1>
                    <p className="text-slate-500 text-sm">Quản lý các cuộc hẹn với ứng viên</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white border p-1 rounded-lg flex text-sm font-medium">
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`px-3 py-1.5 rounded-md transition ${filter === 'upcoming' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Sắp tới
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-md transition ${filter === 'all' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tất cả
                        </button>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Đặt lịch mới
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {filteredInterviews.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Chưa có lịch phỏng vấn</h3>
                        <p className="text-slate-500 mt-1">Hãy đặt lịch phỏng vấn đầu tiên với ứng viên tiềm năng.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-blue-600 font-medium mt-4 hover:underline"
                        >
                            + Đặt lịch ngay
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredInterviews.map((interview) => {
                            const date = new Date(interview.scheduled_at);
                            return (
                                <div key={interview.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-blue-700 border border-blue-100">
                                            <span className="text-xl font-bold">{format(date, 'dd')}</span>
                                            <span className="text-xs uppercase font-semibold">{format(date, 'MMM', { locale: vi })}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 text-lg">
                                                    {interview.candidate?.full_name || "Ứng viên ẩn"}
                                                </h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(interview.status)}`}>
                                                    {getStatusLabel(interview.status)}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    {format(date, 'HH:mm')} - {format(new Date(date.getTime() + 60 * 60 * 1000), 'HH:mm')}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {interview.type === 'online' ? <Video className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
                                                    {interview.type === 'online' ? 'Phỏng vấn Online (Google Meet)' : 'Phỏng vấn trực tiếp'}
                                                </div>
                                                {interview.type === 'online' && interview.meeting_link && (
                                                    <a href={interview.meeting_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 ml-6">
                                                        Vào phòng họp <ChevronRight className="w-3 h-3" />
                                                    </a>
                                                )}
                                                {interview.type === 'offline' && interview.location && (
                                                    <span className="ml-6 text-slate-500">Tại: {interview.location}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white hover:border-slate-300">Chi tiết</button>
                                        {/* Create feedback button later */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Create */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl scale-100 transition-transform">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Đặt lịch phỏng vấn mới</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ứng viên <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white"
                                    required
                                    value={formData.candidate_id}
                                    onChange={e => setFormData({ ...formData, candidate_id: e.target.value })}
                                >
                                    <option value="">-- Chọn ứng viên --</option>
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name} - {c.job?.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời gian <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        required
                                        value={formData.scheduled_at}
                                        onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hình thức</label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'online' })}
                                            className={`py-1.5 text-sm font-medium rounded-lg transition ${formData.type === 'online' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Online
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'offline' })}
                                            className={`py-1.5 text-sm font-medium rounded-lg transition ${formData.type === 'offline' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Offline
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {formData.type === 'online' ? (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Link Google Meet / Zoom</label>
                                    <div className="relative">
                                        <Video className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                        <input
                                            type="url"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="https://meet.google.com/..."
                                            value={formData.meeting_link}
                                            onChange={e => setFormData({ ...formData, meeting_link: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa điểm phỏng vấn</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="Phòng họp 1, Tầng 3..."
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            {/* <div className="border-t border-slate-100 pt-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú (Tùy chọn)</label>
                                <textarea 
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-20"
                                    placeholder="Ghi chú nội bộ cho người phỏng vấn..."
                                    value={formData.notes}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                />
                            </div> */}

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-[0.98] mt-4"
                            >
                                Xác nhận đặt lịch
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
