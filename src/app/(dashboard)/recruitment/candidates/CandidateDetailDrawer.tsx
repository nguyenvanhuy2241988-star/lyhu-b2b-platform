import { X, Calendar, Mail, Phone, Building, DollarSign, Star, Briefcase, Clock, Link as LinkIcon, Edit, MapPin, GraduationCap, CreditCard, User } from 'lucide-react';
import { RecruitmentCandidate, RecruitmentInterview } from '@/lib/recruitmentStore';
import { format } from 'date-fns';

interface CandidateDetailDrawerProps {
    candidate: RecruitmentCandidate;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void; // Trigger edit modal
    interviews: RecruitmentInterview[]; // Pass candidate's interviews
}

export default function CandidateDetailDrawer({ candidate, isOpen, onClose, onEdit, interviews }: CandidateDetailDrawerProps) {
    if (!isOpen) return null;

    const skillsList = candidate.skills ? candidate.skills.split(',').map(s => s.trim()) : [];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>

            {/* Drawer Content */}
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out animate-slide-in-right">
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 border-b p-6 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-2xl">
                            {candidate.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{candidate.full_name}</h2>
                            <div className="flex items-center gap-2 text-slate-500 mt-1">
                                <Briefcase className="w-4 h-4" />
                                <span>{candidate.job?.title || 'Chưa phân loại'}</span>
                                <span className="mx-1">•</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getStatusColor(candidate.status)}`}>
                                    {candidate.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition"
                            title="Chỉnh sửa thông tin"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* 1. Contact Info */}
                    <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <a href={`mailto:${candidate.email}`} className="hover:text-primary-600">{candidate.email || 'Chưa cập nhật'}</a>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <a href={`tel:${candidate.phone}`} className="hover:text-primary-600">{candidate.phone || 'Chưa cập nhật'}</a>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-600">
                                <LinkIcon className="w-4 h-4 text-slate-400" />
                                {candidate.cv_url ? (
                                    <a href={candidate.cv_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline truncate max-w-[200px]">
                                        Link CV
                                    </a>
                                ) : (
                                    <span className="text-slate-400">Chưa có link CV</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Building className="w-4 h-4 text-slate-400" />
                                <span>{candidate.source || 'Nguồn không xác định'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Personal Info & Documents */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-600" />
                            Thông tin cá nhân & Giấy tờ
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-3 text-slate-700">
                                <GraduationCap className="w-4 h-4 text-slate-400" />
                                <span>{candidate.education || 'Chưa cập nhật học vấn'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span>{candidate.hometown || 'Chưa cập nhật quê quán'}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-3 text-slate-700">
                                <Building className="w-4 h-4 text-slate-400" />
                                <span>{candidate.address || 'Chưa cập nhật địa chỉ thường trú'}</span>
                            </div>
                        </div>
                        {/* ID Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border rounded-lg p-2 bg-slate-50">
                                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" /> CCCD Mặt trước
                                </p>
                                {candidate.id_card_front ? (
                                    <a href={candidate.id_card_front} target="_blank" rel="noreferrer" className="block relative aspect-video bg-slate-200 rounded overflow-hidden hover:opacity-90 transition">
                                        <img src={candidate.id_card_front} alt="CCCD Front" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x250?text=Invalid+Image' }} />
                                    </a>
                                ) : (
                                    <div className="aspect-video bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs text-center px-4">
                                        Chưa có ảnh
                                    </div>
                                )}
                            </div>
                            <div className="border rounded-lg p-2 bg-slate-50">
                                <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" /> CCCD Mặt sau
                                </p>
                                {candidate.id_card_back ? (
                                    <a href={candidate.id_card_back} target="_blank" rel="noreferrer" className="block relative aspect-video bg-slate-200 rounded overflow-hidden hover:opacity-90 transition">
                                        <img src={candidate.id_card_back} alt="CCCD Back" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x250?text=Invalid+Image' }} />
                                    </a>
                                ) : (
                                    <div className="aspect-video bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs text-center px-4">
                                        Chưa có ảnh
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Professional Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Thông tin chuyên môn
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Công ty gần nhất</label>
                                <p className="mt-1 font-medium">{candidate.current_company || '---'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Kinh nghiệm</label>
                                <p className="mt-1 font-medium">{candidate.experience_years ? `${candidate.experience_years} năm` : '---'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Mức lương mong muốn</label>
                                <p className="mt-1 font-medium text-green-600">{candidate.expected_salary || '---'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-semibold">Ngày có thể đi làm</label>
                                <p className="mt-1 font-medium">{candidate.availability_date ? format(new Date(candidate.availability_date), 'dd/MM/yyyy') : '---'}</p>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="mt-4">
                            <label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Kỹ năng</label>
                            <div className="flex flex-wrap gap-2">
                                {skillsList.length > 0 ? skillsList.map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                                        {skill}
                                    </span>
                                )) : <span className="text-slate-400 italic">Chưa cập nhật kỹ năng</span>}
                            </div>
                        </div>

                        {/* Rating & Notes */}
                        <div className="mt-6">
                            <label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Ghi chú & Đánh giá</label>
                            <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
                                <div className="flex items-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${star <= (candidate.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                                        />
                                    ))}
                                    <span className="text-sm text-slate-500 ml-2">({candidate.rating || 0}/5)</span>
                                </div>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{candidate.notes || 'Không có ghi chú nào.'}</p>
                            </div>
                        </div>
                    </div>

                    <hr />

                    {/* 3. Interview History */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary-500" />
                            Lịch sử phỏng vấn
                        </h3>
                        {interviews.length > 0 ? (
                            <div className="space-y-3">
                                {interviews.map(interview => (
                                    <div key={interview.id} className="flex items-start gap-4 p-3 bg-white border rounded-lg hover:shadow-sm transition">
                                        <div className={`p-2 rounded-lg ${interview.type === 'online' ? 'bg-primary-50 text-primary-600' : 'bg-purple-50 text-purple-600'}`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <h4 className="font-medium text-slate-900">Phỏng vấn {interview.type === 'online' ? 'Online' : 'Trực tiếp'}</h4>
                                                <span className={`text-xs px-2 py-0.5 rounded ${interview.status === 'scheduled' ? 'bg-primary-100 text-primary-700' :
                                                    interview.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {interview.status === 'scheduled' ? 'Sắp tới' : interview.status === 'completed' ? 'Hoàn thành' : interview.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {format(new Date(interview.scheduled_at), 'HH:mm dd/MM/yyyy')}
                                                {interview.interviewer && ` • với ${interview.interviewer.full_name}`}
                                            </p>
                                            {interview.feedback && (
                                                <p className="text-sm bg-slate-50 p-2 mt-2 rounded italic text-slate-600">"{interview.feedback}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed text-sm">
                                Chưa có lịch phỏng vấn nào được tạo cho ứng viên này.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'new': return 'bg-primary-50 text-primary-700';
        case 'screening': return 'bg-purple-50 text-purple-700';
        case 'interview': return 'bg-orange-50 text-orange-700';
        case 'offer': return 'bg-yellow-50 text-yellow-700';
        case 'hired': return 'bg-green-50 text-green-700';
        case 'rejected': return 'bg-red-50 text-red-700';
        default: return 'bg-slate-50 text-slate-700';
    }
}
