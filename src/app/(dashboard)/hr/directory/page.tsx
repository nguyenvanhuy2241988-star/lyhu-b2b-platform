'use client';

import { useState, useEffect } from 'react';
import { getDepartments, getHRProfiles, Department, HRProfile, updateHRProfile } from '@/lib/hrStore';
import { Search, MapPin, Calendar, Briefcase, Mail, Phone, Filter, GraduationCap, Heart, Facebook, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function HRDirectoryPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [profiles, setProfiles] = useState<HRProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState<string>('all');

    // Edit Modal
    const [editingProfile, setEditingProfile] = useState<HRProfile | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [depts, pros] = await Promise.all([getDepartments(), getHRProfiles()]);
            setDepartments(depts);
            setProfiles(pros);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (updates: Partial<HRProfile>) => {
        if (!editingProfile) return;
        try {
            await updateHRProfile(editingProfile.id, updates);
            loadData(); // Reload
            setEditingProfile(null);
        } catch (error) {
            console.error("Update failed", error);
            alert("Lỗi cập nhật hồ sơ");
        }
    };

    const filteredProfiles = profiles.filter(p => {
        const matchSearch = p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone?.includes(searchTerm);
        const matchDept = selectedDept === 'all' || p.department_id === selectedDept;
        return matchSearch && matchDept;
    });

    return (
        <div className="h-full flex flex-col">
            {/* Header / Toolbar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Danh bạ Nhân sự</h1>
                    <p className="text-sm text-slate-500">Quản lý hồ sơ và thông tin liên hệ</p>
                </div>
                <div className="flex gap-2">
                    {/* Add Employee Button could go here */}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, sđt..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={selectedDept}
                            onChange={e => setSelectedDept(e.target.value)}
                        >
                            <option value="all">Tất cả phòng ban</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div>Đang tải...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProfiles.map(profile => (
                            <div key={profile.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    profile.full_name?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{profile.full_name}</h3>
                                                <p className="text-sm text-slate-500">{profile.position || 'Nhân viên'} &bull; {profile.department?.name || 'Chưa phân phòng'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setEditingProfile(profile)}
                                            className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                                        >
                                            Sửa
                                        </button>
                                    </div>

                                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                                        {profile.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                <span className="truncate">{profile.email}</span>
                                            </div>
                                        )}
                                        {profile.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                {profile.phone}
                                            </div>
                                        )}
                                        {profile.dob && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                Sinh nhật: {format(new Date(profile.dob), 'dd/MM')}
                                            </div>
                                        )}
                                        {profile.place_of_origin && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                {profile.place_of_origin}
                                            </div>
                                        )}
                                        {(profile.education_school || profile.education_major) && (
                                            <div className="flex items-start gap-2">
                                                <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <span>
                                                    {profile.education_school}
                                                    {profile.education_school && profile.education_major && ' - '}
                                                    <span className="text-slate-500 italic">{profile.education_major}</span>
                                                </span>
                                            </div>
                                        )}
                                        {profile.social_facebook && (
                                            <div className="flex items-center gap-2">
                                                <Facebook className="w-4 h-4 text-blue-600" />
                                                <a href={profile.social_facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    Facebook Profile
                                                </a>
                                            </div>
                                        )}
                                        {profile.interests && (
                                            <div className="flex items-start gap-2 pt-1 border-t border-slate-100 mt-2">
                                                <Heart className="w-4 h-4 text-pink-400 mt-0.5" />
                                                <p className="text-xs text-slate-500 line-clamp-2">{profile.interests}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1">
                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                            {profile.work_type === 'parttime' ? 'Part-time' : (profile.work_type === 'intern' ? 'Thực tập sinh' : 'Full-time')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingProfile && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Cập nhật hồ sơ: {editingProfile.full_name}</h2>
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Group 1: Work Info */}
                            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Thông tin công việc
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Phòng ban</label>
                                        <select
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.department_id || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, department_id: e.target.value })}
                                        >
                                            <option value="">-- Chọn --</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Loại hình</label>
                                        <select
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.work_type || 'fulltime'}
                                            onChange={e => setEditingProfile({ ...editingProfile, work_type: e.target.value as any })}
                                        >
                                            <option value="fulltime">Full-time</option>
                                            <option value="parttime">Part-time</option>
                                            <option value="intern">Thực tập</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium mb-1">Vị trí / Chức danh</label>
                                        <input
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.position || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, position: e.target.value })}
                                            placeholder="VD: Telesales Part-time"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Group 2: Personal Info */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" /> Thông tin cá nhân
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Ngày sinh</label>
                                        <input
                                            type="date"
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.dob || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, dob: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Số điện thoại</label>
                                        <input
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.phone || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium mb-1">Quê quán</label>
                                        <input
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.place_of_origin || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, place_of_origin: e.target.value })}
                                            placeholder="VD: Nam Định"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium mb-1">CMND/The căn cước</label>
                                        <input
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.identity_card || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, identity_card: e.target.value })}
                                            placeholder="Số CCCD"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Group 3: Education & Interests */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Học vấn & Sở thích
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Trường học</label>
                                        <input
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.education_school || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, education_school: e.target.value })}
                                            placeholder="VD: ĐH Kinh tế"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Chuyên ngành</label>
                                        <input
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.education_major || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, education_major: e.target.value })}
                                            placeholder="VD: QTKD"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium mb-1">Sở thích</label>
                                        <textarea
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            rows={2}
                                            value={editingProfile.interests || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, interests: e.target.value })}
                                            placeholder="VD: Đọc sách, đá bóng..."
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium mb-1">Facebook Profile</label>
                                        <input
                                            className="w-full border rounded px-2 py-1.5 text-sm outline-none"
                                            value={editingProfile.social_facebook || ''}
                                            onChange={e => setEditingProfile({ ...editingProfile, social_facebook: e.target.value })}
                                            placeholder="https://facebook.com/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setEditingProfile(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded">Hủy</button>
                            <button
                                onClick={() => handleUpdateProfile(editingProfile)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
