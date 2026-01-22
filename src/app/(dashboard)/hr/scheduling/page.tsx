"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import {
    WeeklySchedule, WorkShift, ShiftRegistration, WeeklyUserNote, HRProfile,
    getWeeklySchedules, getWorkShifts, getShiftRegistrations, getHRProfiles,
    createWeeklySchedule, updateWeeklySchedule, registerShift, deleteRegistration,
    updateRegistrationStatus, getWeeklyUserNotes, upsertWeeklyUserNote, uploadHRAsset
} from "@/lib/hrStore";
import { format, getISOWeek, getYear, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import {
    ChevronLeft, ChevronRight, Plus, Loader2, Upload, AlertCircle,
    User as UserIcon, Calendar, Check, X, Edit3, Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function HRSchedulingPage() {
    const { user, role } = useAuth();
    const isAdmin = role === ROLES.ADMIN || role === ROLES.RECRUITER;
    const isHR = isAdmin; // Alias for clarity

    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<HRProfile[]>([]);
    const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<WeeklySchedule | null>(null);
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);
    const [userNotes, setUserNotes] = useState<WeeklyUserNote[]>([]);

    // Banner Upload State
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Setup for current week view or creating new
    const today = new Date();
    const currentWeekInfo = { week: getISOWeek(today), year: getYear(today) };

    const loadData = async () => {
        setLoading(true);
        try {
            const [profilesData, schedulesData, shiftsData] = await Promise.all([
                getHRProfiles(),
                getWeeklySchedules(),
                getWorkShifts()
            ]);
            setProfiles(profilesData);
            setSchedules(schedulesData);
            setShifts(shiftsData); // Now sorted by start time

            // Auto select latest open schedule or create simple view
            if (schedulesData.length > 0) {
                handleSelectSchedule(schedulesData[0]);
            }
        } catch (error) {
            console.error("Failed to load scheduling data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSchedule = async (schedule: WeeklySchedule) => {
        setSelectedSchedule(schedule);
        // Load registrations and notes for this schedule
        try {
            const [regs, notes] = await Promise.all([
                getShiftRegistrations(schedule.id),
                getWeeklyUserNotes(schedule.id)
            ]);
            setRegistrations(regs);
            setUserNotes(notes);
        } catch (err) {
            console.error("Failed to load schedule details", err);
        }
    };

    const handleCreateWeek = async () => {
        if (!isHR) return;
        const targetWeek = currentWeekInfo.week + 1;
        const targetYear = currentWeekInfo.year;

        try {
            const newSchedule = await createWeeklySchedule(targetWeek, targetYear);
            setSchedules([newSchedule, ...schedules]);
            handleSelectSchedule(newSchedule);
        } catch (err) {
            alert("Không thể tạo lịch hoặc lịch tuần này đã tồn tại.");
        }
    };

    // --- REGISTRATION LOGIC ---

    const handleRegister = async (shiftId: string, dateStr: string, targetUserId: string) => {
        if (!selectedSchedule) return;

        // Only allow if own user OR admin
        if (user?.id !== targetUserId && !isHR) return;

        try {
            await registerShift(targetUserId, selectedSchedule.id, shiftId, dateStr);
            // Optimistic update or refresh
            const updatedRegs = await getShiftRegistrations(selectedSchedule.id);
            setRegistrations(updatedRegs);
        } catch (err) {
            console.error("Register failed", err);
            alert("Đăng ký không thành công.");
        }
    };

    const handleCancel = async (regId: string) => {
        if (!selectedSchedule) return;
        try {
            await deleteRegistration(regId, user?.id || "");
            // Refresh
            const updatedRegs = await getShiftRegistrations(selectedSchedule.id);
            setRegistrations(updatedRegs);
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    // --- NOTES LOGIC ---

    const handleUpdateNote = async (userId: string, currentNote: string) => {
        if (!selectedSchedule) return;
        const note = prompt("Nhập ghi chú (VD: Xin nghỉ phép, Đổi ca):", currentNote);
        if (note === null) return; // Cancelled

        try {
            await upsertWeeklyUserNote(selectedSchedule.id, userId, note);
            // Refresh notes
            const updatedNotes = await getWeeklyUserNotes(selectedSchedule.id);
            setUserNotes(updatedNotes);
        } catch (err) {
            console.error("Update note failed", err);
            alert("Lỗi khi lưu ghi chú");
        }
    };

    // --- BANNER LOGIC ---

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !selectedSchedule) return;
        const file = e.target.files[0];

        setUploadingBanner(true);
        try {
            const publicUrl = await uploadHRAsset(file);
            await updateWeeklySchedule(selectedSchedule.id, { banner_url: publicUrl });

            // Update local state
            setSelectedSchedule({ ...selectedSchedule, banner_url: publicUrl });
            // Also update entry in list
            setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? { ...s, banner_url: publicUrl } : s));
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload thất bại");
        } finally {
            setUploadingBanner(false);
        }
    };

    // --- REALTIME ---
    useEffect(() => {
        if (!selectedSchedule?.id) return;

        const channel = supabase
            .channel('hr_scheduling_pivot')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_registrations', filter: `schedule_id=eq.${selectedSchedule.id}` },
                () => getShiftRegistrations(selectedSchedule.id).then(setRegistrations))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_schedule_user_notes', filter: `schedule_id=eq.${selectedSchedule.id}` },
                () => getWeeklyUserNotes(selectedSchedule.id).then(setUserNotes))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedSchedule?.id]);

    useEffect(() => {
        loadData();
    }, []);

    // --- HELPER RENDERING ---

    const getWeekDays = (week: number, year: number) => {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dayOfWeek = simple.getDay();
        const ISOweekStart = simple;
        if (dayOfWeek <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(ISOweekStart);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = selectedSchedule ? getWeekDays(selectedSchedule.week_number, selectedSchedule.year) : [];
    const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

    const getShiftColor = (name: string) => {
        // Updated colors for Teal/Green theme compatibility
        if (name.includes("Sáng")) return "bg-teal-50 text-teal-700 border-teal-200";
        if (name.includes("Chiều")) return "bg-orange-50 text-orange-700 border-orange-200";
        if (name.includes("Tối")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
        return "bg-slate-50 text-slate-700 border-slate-200";
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            {/* --- TOP BAR --- */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col gap-4 shadow-sm z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-teal-900">Lịch làm việc</h1>
                        <p className="text-slate-500 text-sm">Quản lý ca làm việc toàn hệ thống</p>
                    </div>
                    {isHR && (
                        <button
                            onClick={handleCreateWeek}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Tạo tuần mới
                        </button>
                    )}
                </div>

                {/* Week Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1 chrome-scrollbar-hidden">
                    {schedules.map(sch => (
                        <button
                            key={sch.id}
                            onClick={() => handleSelectSchedule(sch)}
                            className={`flex flex-col items-start min-w-[140px] px-4 py-2 rounded-lg border transition ${selectedSchedule?.id === sch.id
                                    ? "bg-teal-50 border-teal-500 ring-1 ring-teal-500/20"
                                    : "bg-white border-slate-200 hover:border-teal-300"
                                }`}
                        >
                            <span className={`text-xs font-bold uppercase tracking-wider ${selectedSchedule?.id === sch.id ? "text-teal-700" : "text-slate-500"}`}>
                                Tuần {sch.week_number}
                            </span>
                            <span className="text-[10px] text-slate-400">Năm {sch.year}</span>
                            {sch.status === 'open' && <span className="mt-1 text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">Mở</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- BANNER AREA --- */}
            {selectedSchedule && (
                <div className="relative w-full bg-slate-100 border-b border-slate-200 group">
                    {selectedSchedule.banner_url ? (
                        <div className="w-full h-48 md:h-64 relative overflow-hidden">
                            <img
                                src={selectedSchedule.banner_url}
                                alt="Schedule Banner"
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay gradient for text readability if needed */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>
                    ) : (
                        isHR && (
                            <div className="w-full h-24 flex flex-col items-center justify-center text-slate-400 border-dashed border-2 border-slate-300 m-4 rounded-xl mx-auto w-[calc(100%-2rem)]">
                                <Upload className="w-5 h-5 mb-1" />
                                <span className="text-xs">Chưa có banner. Upload ngay để trang trí!</span>
                            </div>
                        )
                    )}

                    {/* Admin Upload Button */}
                    {isHR && (
                        <div className={`absolute top-4 right-4 ${selectedSchedule.banner_url ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity`}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleBannerUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingBanner}
                                className="bg-white/90 backdrop-blur text-slate-700 hover:text-teal-600 px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-xs font-medium flex items-center gap-2"
                            >
                                {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                                {selectedSchedule.banner_url ? "Thay Banner" : "Upload Banner"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- MAIN CONTENT: PIVOT TABLE --- */}
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50/50">
                {selectedSchedule ? (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-w-[1000px]">
                        <table className="w-full text-sm">
                            <thead className="bg-[#009688] text-white">
                                <tr>
                                    <th className="py-3 px-4 text-left font-medium w-64 uppercase text-xs tracking-wider sticky left-0 z-20 bg-[#009688]">Nhân viên</th>
                                    <th className="py-3 px-4 text-left font-medium w-48 uppercase text-xs tracking-wider">Ghi chú</th>
                                    {weekDays.map((date, idx) => (
                                        <th key={idx} className="py-3 px-2 text-center font-medium min-w-[120px]">
                                            <div className="flex flex-col items-center">
                                                <span className="uppercase text-[10px] opacity-80">{DAY_NAMES[idx]}</span>
                                                <span className="text-lg font-bold leading-none">{format(date, 'dd/MM')}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {profiles.map((profile) => {
                                    const userNote = userNotes.find(n => n.user_id === profile.id);
                                    const canEditNote = isHR || user?.id === profile.id;

                                    return (
                                        <tr key={profile.id} className="hover:bg-slate-50 group transition-colors">
                                            {/* Employee Col */}
                                            <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    {profile.avatar_url ? (
                                                        <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs border border-teal-200">
                                                            {profile.full_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{profile.full_name}</div>
                                                        <div className="text-[11px] text-slate-400 capitalize">{profile.role}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Note Col */}
                                            <td className="py-3 px-4 border-r border-slate-100 relative">
                                                <div
                                                    onClick={() => canEditNote && handleUpdateNote(profile.id, userNote?.note || "")}
                                                    className={`min-h-[2rem] rounded px-2 py-1.5 text-xs transition-colors cursor-pointer ${userNote?.note
                                                            ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                                                            : canEditNote ? "hover:bg-slate-100 text-slate-400 italic border border-transparent hover:border-slate-200" : "text-transparent"
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center group/note">
                                                        <span className="truncate max-w-[10rem]">{userNote?.note || (canEditNote ? "Thêm ghi chú..." : "")}</span>
                                                        {canEditNote && <Edit3 className="w-3 h-3 opacity-0 group-hover/note:opacity-50" />}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Days Cols */}
                                            {weekDays.map((date, idx) => {
                                                const dateStr = format(date, 'yyyy-MM-dd');
                                                // Find registration for this user on this day
                                                const reg = registrations.find(r => r.user_id === profile.id && r.date === dateStr);
                                                const canAction = isHR || (user?.id === profile.id && selectedSchedule.status === 'open');

                                                return (
                                                    <td key={idx} className="py-2 px-2 border-r border-slate-50 text-center relative h-16">
                                                        {reg ? (
                                                            // Registered
                                                            <div className="flex flex-col h-full gap-1">
                                                                <div className={`flex-1 rounded-md border flex items-center justify-center text-xs font-bold shadow-sm ${getShiftColor(reg.shift?.name || "")} relative group/cell`}>
                                                                    {reg.shift?.name}
                                                                    {/* Delete/Cancel Button */}
                                                                    {canAction && (
                                                                        <button
                                                                            onClick={() => handleCancel(reg.id)}
                                                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/cell:opacity-100 shadow-sm transition-opacity z-20"
                                                                            title="Hủy đăng ký"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className={`text-[9px] font-bold uppercase ${reg.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                                    {reg.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // Empty Slot
                                                            canAction ? (
                                                                <div className="grid grid-cols-1 gap-1 h-full opacity-0 hover:opacity-100 transition-opacity duration-200">
                                                                    {shifts.map(shift => (
                                                                        <button
                                                                            key={shift.id}
                                                                            onClick={() => handleRegister(shift.id, dateStr, profile.id)}
                                                                            className="rounded bg-teal-50 hover:bg-teal-100 text-teal-700 text-[9px] border border-teal-200 py-0.5"
                                                                        >
                                                                            {shift.name} ({shift.start_time.slice(0, 5)})
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-200 text-lg select-none">•</span>
                                                            )
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        Chọn một tuần để xem lịch
                    </div>
                )}
            </div>
        </div>
    );
}
