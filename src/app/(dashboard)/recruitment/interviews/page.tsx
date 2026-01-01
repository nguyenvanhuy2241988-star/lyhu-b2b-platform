'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Video, MapPin, Phone } from 'lucide-react';
import { getInterviews, getCandidates, scheduleInterview, RecruitmentInterview, RecruitmentCandidate } from '@/lib/recruitmentStore';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<RecruitmentInterview[]>([]);
    const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [newInterview, setNewInterview] = useState<Partial<RecruitmentInterview>>({
        candidate_id: '',
        scheduled_at: '',
        type: 'online',
        meeting_link: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [intData, candData] = await Promise.all([getInterviews(), getCandidates()]);
            setInterviews(intData);
            setCandidates(candData);
            if (candData.length > 0) {
                setNewInterview(prev => ({ ...prev, candidate_id: candData[0].id }));
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
            await scheduleInterview(newInterview);
            setShowModal(false);
            loadData();
            setNewInterview({ candidate_id: candidates[0]?.id || '', scheduled_at: '', type: 'online', meeting_link: '' });
        } catch (error) {
            alert('Lỗi đặt lịch phỏng vấn');
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Lịch phỏng vấn</h1>
                    <p className="text-slate-500">Theo dõi các cuộc phỏng vấn sắp tới</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Đặt lịch mới
                </button>
            </div>

            {loading ? (
                <div>Đang tải...</div>
            ) : (
                <div className="space-y-4">
                    {interviews.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">Chưa có lịch phỏng vấn nào</div>
                    ) : (
                        interviews.map(int => (
                            <div key={int.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-50 text-blue-600 p-3 rounded-lg text-center min-w-[60px]">
                                        <div className="text-xl font-bold">{format(new Date(int.scheduled_at), 'dd')}</div>
                                        <div className="text-xs uppercase font-medium">{format(new Date(int.scheduled_at), 'MMM', { locale: vi })}</div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Phỏng vấn: {int.candidate?.full_name || 'Unknown'}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {format(new Date(int.scheduled_at), 'HH:mm')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {int.type === 'online' ? <Video className="w-4 h-4 text-blue-500" /> :
                                                    int.type === 'phone' ? <Phone className="w-4 h-4 text-green-500" /> :
                                                        <MapPin className="w-4 h-4 text-red-500" />}
                                                <span className="capitalize">{int.type === 'online' ? 'Online Meeting' : int.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {int.meeting_link && (
                                        <a href={int.meeting_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium">
                                            Vào phòng họp
                                        </a>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${int.status === 'scheduled' ? 'bg-yellow-50 text-yellow-700' :
                                            int.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {int.status === 'scheduled' ? 'Sắp diễn ra' : int.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Đặt lịch phỏng vấn</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Ứng viên</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={newInterview.candidate_id}
                                    onChange={e => setNewInterview({ ...newInterview, candidate_id: e.target.value })}
                                >
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Thời gian</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={newInterview.scheduled_at}
                                        onChange={e => setNewInterview({ ...newInterview, scheduled_at: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hình thức</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={newInterview.type}
                                        onChange={e => setNewInterview({ ...newInterview, type: e.target.value as any })}
                                    >
                                        <option value="online">Online (Video)</option>
                                        <option value="offline">Offline (Tại văn phòng)</option>
                                        <option value="phone">Qua điện thoại</option>
                                    </select>
                                </div>
                            </div>
                            {newInterview.type === 'online' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Link họp (Google Meet/Zoom)</label>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={newInterview.meeting_link}
                                        placeholder="https://meet.google.com/..."
                                        onChange={e => setNewInterview({ ...newInterview, meeting_link: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
