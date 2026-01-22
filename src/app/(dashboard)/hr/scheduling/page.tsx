"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import {
    WeeklySchedule, WorkShift, ShiftRegistration, WeeklyUserNote, HRProfile,
    getWeeklySchedules, getWorkShifts, getShiftRegistrations, getHRProfiles,
    createWeeklySchedule, updateWeeklySchedule, registerShift, deleteRegistration,
    upsertWeeklyUserNote, uploadHRAsset, getWeeklyUserNotes
} from "@/lib/hrStore";
import { format, getISOWeek, getYear } from "date-fns";
import {
    Plus, Loader2, Upload, Edit3, Save, ChevronDown, Check, X
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function HRSchedulingPage() {
    const { user, role } = useAuth();
    const isAdmin = role === ROLES.ADMIN || role === ROLES.RECRUITER;
    const isHR = isAdmin;

    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<HRProfile[]>([]);
    const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<WeeklySchedule | null>(null);
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);
    const [userNotes, setUserNotes] = useState<WeeklyUserNote[]>([]);

    const [uploadingBanner, setUploadingBanner] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dropdown State
    const [openDropdown, setOpenDropdown] = useState<{ userId: string, date: string } | null>(null);

    // Initial Data
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
            setShifts(shiftsData);

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
        try {
            const [regs, notes] = await Promise.all([
                getShiftRegistrations(schedule.id),
                getWeeklyUserNotes(schedule.id)
            ]);
            setRegistrations(regs);
            setUserNotes(notes);
        } catch (err) {
            console.error("Failed", err);
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
            alert("Lỗi khi tạo lịch");
        }
    };

    // --- Actions ---

    const handleShiftSelect = async (shiftId: string, dateStr: string, targetUserId: string) => {
        if (!selectedSchedule) return;
        try {
            // Check if already registered
            const existing = registrations.find(r => r.user_id === targetUserId && r.date === dateStr);
            if (existing) {
                // If clicking same shift -> do nothing or maybe toggle? Let's just switch.
                // If we need to replace, we define a logic (delete then add or update).
                // Simplest: Delete old, add new.
                await deleteRegistration(existing.id, user?.id || "");
            }

            // Register new
            await registerShift(targetUserId, selectedSchedule.id, shiftId, dateStr);

            // Refresh
            const updatedRegs = await getShiftRegistrations(selectedSchedule.id);
            setRegistrations(updatedRegs);
            setOpenDropdown(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearShift = async (regId: string) => {
        if (!selectedSchedule) return;
        try {
            await deleteRegistration(regId, user?.id || "");
            const updatedRegs = await getShiftRegistrations(selectedSchedule.id);
            setRegistrations(updatedRegs);
            setOpenDropdown(null);
        } catch (err) { console.error(err); }
    };

    const handleUpdateNote = async (userId: string, note: string) => {
        if (!selectedSchedule) return;
        try {
            await upsertWeeklyUserNote(selectedSchedule.id, userId, note);
            const updatedNotes = await getWeeklyUserNotes(selectedSchedule.id);
            setUserNotes(updatedNotes);
        } catch (err) { console.error(err); }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !selectedSchedule) return;
        setUploadingBanner(true);
        try {
            const publicUrl = await uploadHRAsset(e.target.files[0]);
            await updateWeeklySchedule(selectedSchedule.id, { banner_url: publicUrl });
            setSelectedSchedule({ ...selectedSchedule, banner_url: publicUrl });
            setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? { ...s, banner_url: publicUrl } : s));
        } catch (err) { alert("Upload failed"); }
        finally { setUploadingBanner(false); }
    };

    // --- Effects ---

    useEffect(() => {
        if (!selectedSchedule?.id) return;
        const channel = supabase.channel('hr_excel_view')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_registrations', filter: `schedule_id=eq.${selectedSchedule.id}` },
                () => getShiftRegistrations(selectedSchedule.id).then(setRegistrations))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_schedule_user_notes', filter: `schedule_id=eq.${selectedSchedule.id}` },
                () => getWeeklyUserNotes(selectedSchedule.id).then(setUserNotes))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [selectedSchedule?.id]);

    useEffect(() => { loadData(); }, []);

    // --- Helpers ---

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
        if (name.includes("Sáng")) return "bg-teal-100 text-teal-800 border-teal-300";
        if (name.includes("Chiều")) return "bg-orange-100 text-orange-800 border-orange-300";
        if (name.includes("Tối")) return "bg-indigo-100 text-indigo-800 border-indigo-300";
        return "bg-slate-100 text-slate-800 border-slate-300";
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null);
        if (openDropdown) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdown]);

    if (loading) return <div className="h-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header / Banner */}
            {selectedSchedule?.banner_url && (
                <div className="w-full h-32 md:h-48 relative shrink-0 group">
                    <img src={selectedSchedule.banner_url} className="w-full h-full object-cover" />
                    {isHR && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                            <button onClick={() => fileInputRef.current?.click()} className="bg-white p-1 rounded shadow text-slate-600 hover:text-teal-600">
                                <Edit3 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Toolbar */}
            <div className="px-4 py-2 border-b border-slate-300 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold text-teal-900">Lịch làm việc</h1>
                    <div className="flex gap-1 overflow-x-auto max-w-[50vw] chrome-scrollbar-hidden">
                        {schedules.map(sch => (
                            <button
                                key={sch.id}
                                onClick={() => handleSelectSchedule(sch)}
                                className={`px-3 py-1 text-xs border rounded transition whitespace-nowrap ${selectedSchedule?.id === sch.id
                                        ? "bg-teal-600 text-white border-teal-700 font-medium"
                                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                                    }`}
                            >
                                Tuần {sch.week_number}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Banner Toggle if empty */}
                    {isHR && !selectedSchedule?.banner_url && (
                        <div className="relative">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100">
                                <Upload className="w-3 h-3" /> Upload Banner
                            </button>
                        </div>
                    )}
                    {isHR && (
                        <button onClick={handleCreateWeek} className="flex items-center gap-1 text-xs bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700">
                            <Plus className="w-3 h-3" /> Tuần mới
                        </button>
                    )}
                </div>
            </div>

            {/* Content: Excel Grid */}
            <div className="flex-1 overflow-auto bg-white relative">
                {selectedSchedule ? (
                    <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-30 bg-teal-700 text-white shadow-sm">
                            <tr>
                                <th className="sticky left-0 z-40 bg-teal-700 border border-teal-800 py-2 px-2 w-48 text-left text-xs font-semibold">Nhân viên</th>
                                <th className="border border-teal-800 py-2 px-2 w-48 text-left text-xs font-semibold">Ghi chú</th>
                                {weekDays.map((date, idx) => (
                                    <th key={idx} className="border border-teal-800 py-2 px-1 min-w-[100px] text-center">
                                        <div className="text-[10px] uppercase opacity-80">{DAY_NAMES[idx]}</div>
                                        <div className="font-bold">{format(date, 'dd/MM')}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((profile, rowIdx) => {
                                const userNote = userNotes.find(n => n.user_id === profile.id);
                                const canEdit = isHR || (user?.id === profile.id);

                                return (
                                    <tr key={profile.id} className="hover:bg-slate-50">
                                        {/* Employee */}
                                        <td className="sticky left-0 z-20 bg-white hover:bg-slate-50 border border-slate-300 px-2 py-1 h-10">
                                            <div className="flex items-center gap-2 truncate">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                                                    {profile.avatar_url ? <img src={profile.avatar_url} className="w-6 h-6 rounded-full object-cover" /> : profile.full_name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className="text-xs font-medium text-slate-900 truncate">{profile.full_name}</span>
                                                    {/* <span className="text-[9px] text-slate-400 capitalize">{profile.role}</span> */}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Note Input */}
                                        <td className="border border-slate-300 p-0 h-10 relative">
                                            <input
                                                type="text"
                                                disabled={!canEdit}
                                                defaultValue={userNote?.note || ""}
                                                onBlur={(e) => handleUpdateNote(profile.id, e.target.value)}
                                                className="w-full h-full px-2 text-xs bg-transparent border-none focus:ring-1 focus:ring-teal-500 focus:bg-white truncate disabled:bg-slate-50 disabled:text-slate-400"
                                                placeholder={canEdit ? "..." : ""}
                                            />
                                        </td>

                                        {/* Days */}
                                        {weekDays.map((date, dayIdx) => {
                                            const dateStr = format(date, 'yyyy-MM-dd');
                                            const reg = registrations.find(r => r.user_id === profile.id && r.date === dateStr);
                                            const isOpen = selectedSchedule.status === 'open';
                                            const canAction = isHR || (user?.id === profile.id && isOpen);

                                            // Unique ID for this cell dropdown
                                            const cellId = `${profile.id}-${dateStr}`;
                                            const isDropdownOpen = openDropdown?.userId === profile.id && openDropdown?.date === dateStr;

                                            return (
                                                <td
                                                    key={dayIdx}
                                                    className={`border border-slate-300 p-0 h-10 relative align-middle ${canAction ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (canAction) setOpenDropdown(isDropdownOpen ? null : { userId: profile.id, date: dateStr });
                                                    }}
                                                >
                                                    {reg ? (
                                                        <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${getShiftColor(reg.shift?.name || "")}`}>
                                                            {reg.shift?.name}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full"></div> // Empty
                                                    )}

                                                    {/* Dropdown Menu */}
                                                    {isDropdownOpen && (
                                                        <div className="absolute top-full left-0 z-50 w-32 bg-white border border-slate-200 shadow-lg rounded-sm py-1">
                                                            <div className="px-2 py-1 text-[10px] text-slate-400 bg-slate-50 border-b border-slate-100 mb-1">
                                                                Chọn ca ({format(date, 'dd/MM')})
                                                            </div>
                                                            {shifts.map(shift => (
                                                                <button
                                                                    key={shift.id}
                                                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-teal-50 hover:text-teal-700 flex items-center justify-between group"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleShiftSelect(shift.id, dateStr, profile.id);
                                                                    }}
                                                                >
                                                                    <span>{shift.name}</span>
                                                                    <span className="text-[9px] text-slate-400 group-hover:text-teal-500">{shift.start_time.slice(0, 5)}</span>
                                                                </button>
                                                            ))}
                                                            {reg && (
                                                                <button
                                                                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border-t border-slate-100 mt-1"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleClearShift(reg.id);
                                                                    }}
                                                                >
                                                                    Hủy đăng ký
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-slate-400">Chọn lịch làm việc để xem</div>
                )}
            </div>
        </div>
    );
}
