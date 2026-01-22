"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import {
    WeeklySchedule, WorkShift, ShiftRegistration, HRProfile,
    getWeeklySchedules, getWorkShifts, getShiftRegistrations, getHRProfiles,
    createWeeklySchedule, updateWeeklySchedule, registerShift, deleteRegistration,
    uploadHRAsset
} from "@/lib/hrStore";
import { format, getISOWeek, getYear, addWeeks, startOfWeek, addDays, getWeek } from "date-fns";
import {
    Plus, Loader2, Upload, Edit3, ChevronDown, Calendar, MessageSquare, Save, X, Palette
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

    // UI State
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingPoster, setUploadingPoster] = useState(false);
    const [createDate, setCreateDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isCreating, setIsCreating] = useState(false);

    // Dropdown/Note State
    // { userId, date, mode: 'select' | 'note', noteValue }
    const [openDropdown, setOpenDropdown] = useState<{
        userId: string,
        date: string
    } | null>(null);
    const [noteValue, setNoteValue] = useState("");

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const posterInputRef = useRef<HTMLInputElement>(null);

    // Initial Data
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
            const regs = await getShiftRegistrations(schedule.id);
            setRegistrations(regs);
        } catch (err) {
            console.error("Failed", err);
        }
    };

    const handleCreateWithDate = async () => {
        if (!isHR || !createDate) return;
        const dateObj = new Date(createDate);
        const targetWeek = getISOWeek(dateObj);
        const targetYear = getYear(dateObj);

        // Check exists
        const exists = schedules.find(s => s.week_number === targetWeek && s.year === targetYear);
        if (exists) {
            alert(`Lịch tuần ${targetWeek}/${targetYear} đã tồn tại!`);
            handleSelectSchedule(exists);
            setIsCreating(false);
            return;
        }

        try {
            const newSchedule = await createWeeklySchedule(targetWeek, targetYear);
            setSchedules([newSchedule, ...schedules]);
            handleSelectSchedule(newSchedule);
            setIsCreating(false);
        } catch (err) {
            alert("Lỗi khi tạo lịch");
        }
    };

    // --- Actions ---

    const handleRegister = async (shiftId: string, dateStr: string, targetUserId: string, note?: string) => {
        if (!selectedSchedule) return;
        try {
            // Check existing
            const existing = registrations.find(r => r.user_id === targetUserId && r.date === dateStr);
            if (existing) {
                await deleteRegistration(existing.id, user?.id || "");
            }
            await registerShift(targetUserId, selectedSchedule.id, shiftId, dateStr, note);

            // Refresh
            const updatedRegs = await getShiftRegistrations(selectedSchedule.id);
            setRegistrations(updatedRegs);
            setOpenDropdown(null);
            setNoteValue("");
        } catch (err) { console.error(err); }
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

    const handleAssetUpload = async (file: File, type: 'banner' | 'poster') => {
        if (!selectedSchedule) return;
        const setUploading = type === 'banner' ? setUploadingBanner : setUploadingPoster;
        setUploading(true);
        try {
            const publicUrl = await uploadHRAsset(file);
            const updates = type === 'banner' ? { banner_url: publicUrl } : { poster_url: publicUrl };

            await updateWeeklySchedule(selectedSchedule.id, updates);

            const updatedSch = { ...selectedSchedule, ...updates };
            setSelectedSchedule(updatedSch);
            setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? updatedSch : s));
        } catch (err) { alert("Upload failed"); }
        finally { setUploading(false); }
    };

    const handleUpdateTheme = async (color: string) => {
        if (!selectedSchedule) return;
        await updateWeeklySchedule(selectedSchedule.id, { theme_color: color });
        setSelectedSchedule({ ...selectedSchedule, theme_color: color });
        setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? { ...s, theme_color: color } : s));
    };

    // --- Effects ---
    useEffect(() => {
        if (!selectedSchedule?.id) return;
        const channel = supabase.channel('hr_phase3_view')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_registrations', filter: `schedule_id=eq.${selectedSchedule.id}` },
                () => getShiftRegistrations(selectedSchedule.id).then(setRegistrations))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_schedules', filter: `id=eq.${selectedSchedule.id}` },
                (payload) => {
                    const newSch = payload.new as WeeklySchedule;
                    setSelectedSchedule(prev => prev?.id === newSch.id ? newSch : prev);
                    setSchedules(prev => prev.map(s => s.id === newSch.id ? newSch : s));
                })
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
    const themeColor = selectedSchedule?.theme_color || "#0d9488"; // Default Teal-600

    const getShiftColor = (name: string) => {
        if (name.includes("Sáng")) return "bg-teal-50 text-teal-800 border-teal-200";
        if (name.includes("Chiều")) return "bg-orange-50 text-orange-800 border-orange-200";
        if (name.includes("Tối")) return "bg-indigo-50 text-indigo-800 border-indigo-200";
        return "bg-slate-50 text-slate-800 border-slate-200";
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null);
        if (openDropdown) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdown]);

    if (loading) return <div className="h-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} /></div>;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* 1. Header & Banner/Poster Area */}
            <div className="shrink-0 flex flex-col md:flex-row border-b border-slate-200">
                {selectedSchedule && (
                    <div className="flex-1 relative group">
                        {/* Banner: Object Contain / Auto Height */}
                        {selectedSchedule.banner_url ? (
                            <img src={selectedSchedule.banner_url} className="w-full max-h-48 object-contain bg-slate-50" />
                        ) : (
                            <div className="w-full h-32 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">Chưa có Banner</div>
                        )}

                        {isHR && (
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], 'banner')} />
                                <button onClick={() => bannerInputRef.current?.click()} className="bg-white/80 p-1.5 rounded shadow hover:text-teal-600" title="Đổi Banner">
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {/* Poster Side Area (Optional) */}
                {selectedSchedule && (selectedSchedule.poster_url || isHR) && (
                    <div className="w-full md:w-64 h-32 md:h-auto border-l border-slate-200 relative group flex items-center justify-center bg-slate-50">
                        {selectedSchedule.poster_url ? (
                            <img src={selectedSchedule.poster_url} className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 mb-2">Poster (Thông báo/Lưu ý)</p>
                            </div>
                        )}
                        {isHR && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                                <input type="file" ref={posterInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], 'poster')} />
                                <button onClick={() => posterInputRef.current?.click()} className="bg-white p-2 rounded shadow hover:text-teal-600 flex gap-1 items-center text-xs">
                                    <Upload className="w-4 h-4" /> {selectedSchedule.poster_url ? 'Đổi Poster' : 'Up Poster'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Toolbar */}
            <div className="px-4 py-2 border-b border-slate-300 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold" style={{ color: themeColor }}>Lịch làm việc</h1>
                    <div className="flex gap-1 overflow-x-auto max-w-[40vw] chrome-scrollbar-hidden">
                        {schedules.map(sch => (
                            <button
                                key={sch.id}
                                onClick={() => handleSelectSchedule(sch)}
                                className={`px-3 py-1 text-xs border rounded transition whitespace-nowrap font-medium ${selectedSchedule?.id === sch.id
                                        ? "text-white border-transparent"
                                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                                    }`}
                                style={selectedSchedule?.id === sch.id ? { backgroundColor: sch.theme_color || '#0d9488' } : {}}
                            >
                                Tuần {sch.week_number}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Theme Color Picker */}
                    {isHR && selectedSchedule && (
                        <div className="relative group">
                            <button className="p-1.5 rounded hover:bg-slate-200 text-slate-500"><Palette className="w-4 h-4" /></button>
                            <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 shadow-lg p-2 rounded grid grid-cols-4 gap-1 w-32 hidden group-hover:grid z-50">
                                {['#0d9488', '#dc2626', '#ea580c', '#2563eb', '#7c3aed', '#db2777', '#ca8a04', '#0f172a'].map(c => (
                                    <button
                                        key={c}
                                        className="w-6 h-6 rounded-full border border-slate-200"
                                        style={{ backgroundColor: c }}
                                        onClick={() => handleUpdateTheme(c)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create Week Button with Popover */}
                    {isHR && (
                        <div className="relative">
                            <button onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded shadow-sm hover:opacity-90" style={{ backgroundColor: themeColor }}>
                                <Plus className="w-3 h-3" /> Tuần mới
                            </button>
                            {isCreating && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded p-3 z-50">
                                    <h3 className="text-xs font-bold text-slate-700 mb-2">Tạo lịch tuần mới</h3>
                                    <div className="mb-3">
                                        <label className="text-[10px] text-slate-500 block mb-1">Ngày bắt đầu tuần (Thứ 2)</label>
                                        <input
                                            type="date"
                                            value={createDate}
                                            onChange={(e) => setCreateDate(e.target.value)}
                                            className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Tuần {createDate ? getISOWeek(new Date(createDate)) : '...'} - Năm {createDate ? getYear(new Date(createDate)) : '...'}
                                        </p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsCreating(false)} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">Hủy</button>
                                        <button onClick={handleCreateWithDate} className="px-2 py-1 text-xs text-white rounded hover:opacity-90" style={{ backgroundColor: themeColor }}>Tạo</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Main Data Grid */}
            <div className="flex-1 overflow-auto bg-white relative">
                {selectedSchedule ? (
                    <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-30 text-white shadow-sm" style={{ backgroundColor: themeColor }}>
                            <tr>
                                <th className="sticky left-0 z-40 border border-black/10 py-2 px-2 w-48 text-left text-xs font-semibold" style={{ backgroundColor: themeColor }}>Nhân viên</th>
                                {weekDays.map((date, idx) => (
                                    <th key={idx} className="border border-black/10 py-2 px-1 min-w-[120px] text-center">
                                        <div className="text-[10px] uppercase opacity-80">{DAY_NAMES[idx]}</div>
                                        <div className="font-bold">{format(date, 'dd/MM')}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((profile) => {
                                return (
                                    <tr key={profile.id} className="hover:bg-slate-50">
                                        {/* Employee Column */}
                                        <td className="sticky left-0 z-20 bg-white hover:bg-slate-50 border border-slate-300 px-2 py-1 h-12 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            <div className="flex items-center gap-2 truncate">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 border border-slate-200">
                                                    {profile.avatar_url ? <img src={profile.avatar_url} className="w-7 h-7 rounded-full object-cover" /> : profile.full_name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className="text-xs font-medium text-slate-900 truncate">{profile.full_name}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Days Columns */}
                                        {weekDays.map((date, dayIdx) => {
                                            const dateStr = format(date, 'yyyy-MM-dd');
                                            const reg = registrations.find(r => r.user_id === profile.id && r.date === dateStr);
                                            const isOpen = selectedSchedule.status === 'open';
                                            const canAction = isHR || (user?.id === profile.id && isOpen);

                                            // Unique dropdown ID
                                            const isDropdownOpen = openDropdown?.userId === profile.id && openDropdown?.date === dateStr;

                                            return (
                                                <td
                                                    key={dayIdx}
                                                    className={`border border-slate-300 p-1 h-12 relative align-top ${canAction ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                                                    onClick={(e) => {
                                                        if (canAction && !isDropdownOpen) {
                                                            setOpenDropdown({ userId: profile.id, date: dateStr });
                                                            setNoteValue(reg?.note || "");
                                                        }
                                                    }}
                                                >
                                                    {/* Cell Content */}
                                                    {reg ? (
                                                        <div className={`w-full h-full rounded px-2 py-1 flex flex-col justify-center ${getShiftColor(reg.shift?.name || "")}`}>
                                                            <div className="text-[11px] font-bold leading-tight">{reg.shift?.name}</div>
                                                            {reg.note && (
                                                                <div className="text-[9px] opacity-75 truncate mt-0.5 italic flex items-center gap-0.5">
                                                                    <MessageSquare className="w-2.5 h-2.5" />
                                                                    {reg.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full"></div>
                                                    )}

                                                    {/* Interaction Dropdown/Popup */}
                                                    {isDropdownOpen && (
                                                        <div className="absolute top-full left-0 z-50 w-48 bg-white border border-slate-200 shadow-2xl rounded-md overflow-hidden animate-in fade-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                                                            <div className="px-2 py-1 text-[10px] bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 flex justify-between items-center">
                                                                <span>{format(date, 'dd/MM')} - {profile.full_name}</span>
                                                                <button onClick={() => setOpenDropdown(null)}><X className="w-3 h-3 hover:text-red-500" /></button>
                                                            </div>

                                                            {/* Shift List */}
                                                            <div className="p-1 space-y-0.5 max-h-32 overflow-y-auto">
                                                                {shifts.map(shift => (
                                                                    <button
                                                                        key={shift.id}
                                                                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-teal-50 hover:text-teal-700 flex items-center justify-between ${reg?.shift_id === shift.id ? 'bg-teal-50 text-teal-700 font-medium' : ''}`}
                                                                        onClick={() => handleRegister(shift.id, dateStr, profile.id, noteValue)}
                                                                    >
                                                                        <span>{shift.name}</span>
                                                                        <span className="text-[9px] text-slate-400">{shift.start_time.slice(0, 5)}</span>
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* Note Input */}
                                                            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ghi chú (omg...)"
                                                                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none mb-1"
                                                                    value={noteValue}
                                                                    onChange={(e) => setNoteValue(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && reg) {
                                                                            // Update note for existing reg without changing shift
                                                                            handleRegister(reg.shift_id, dateStr, profile.id, noteValue);
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="flex justify-between items-center mt-1">
                                                                    {reg && (
                                                                        <button onClick={() => handleClearShift(reg.id)} className="text-[10px] text-red-500 hover:underline">Hủy đăng ký</button>
                                                                    )}
                                                                    {reg && (
                                                                        <button onClick={() => handleRegister(reg.shift_id, dateStr, profile.id, noteValue)} className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded hover:bg-teal-700">Lưu note</button>
                                                                    )}
                                                                </div>
                                                            </div>
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
