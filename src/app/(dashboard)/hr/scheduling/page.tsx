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
import { format, getISOWeek, getYear } from "date-fns";
import {
    Plus, Loader2, Upload, Edit3, MessageSquare, X, Palette, Trash2
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

    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingPoster, setUploadingPoster] = useState(false);
    const [createDate, setCreateDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isCreating, setIsCreating] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // { userId, date }
    const [openDropdown, setOpenDropdown] = useState<{ userId: string, date: string } | null>(null);
    const [noteValue, setNoteValue] = useState("");

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const posterInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profilesData, schedulesData, shiftsData] = await Promise.all([
                getHRProfiles(),
                getWeeklySchedules(),
                getWorkShifts()
            ]);
            setProfiles(profilesData);

            // Sort schedules: Oldest to Newest (1 -> 52)? Or Newest to Oldest?
            // User requested "Week 5 before Week 4" -> Descending (Newest First) which is current.
            // Wait, User said "Tuần 5 xếp trước tuần 4" -> This implies 5 is appearing *before* 4 in the list (Left to Right).
            // Currently my code: order('year', desc).order('week', desc).
            // This means [Week 5, Week 4, Week 3].
            // If user COMPLAINED about this, they might want [Week 3, Week 4, Week 5] (Ascending).
            // Let's sort ASCENDING for the buttons list so it reads naturally like a timeline.
            // Sort in JS to be safe.
            const sortedSchedules = schedulesData.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.week_number - b.week_number;
            });

            setSchedules(sortedSchedules);
            setShifts(shiftsData);

            // Auto select latest
            if (sortedSchedules.length > 0) {
                // Select the last one (latest week) by default
                handleSelectSchedule(sortedSchedules[sortedSchedules.length - 1]);
            }
        } catch (error) {
            console.error("Failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSchedule = async (schedule: WeeklySchedule) => {
        setSelectedSchedule(schedule);
        try {
            const regs = await getShiftRegistrations(schedule.id);
            setRegistrations(regs);
        } catch (err) { console.error(err); }
    };

    const handleCreateWithDate = async () => {
        if (!isHR || !createDate) return;
        const dateObj = new Date(createDate);
        const targetWeek = getISOWeek(dateObj);
        const targetYear = getYear(dateObj);

        const exists = schedules.find(s => s.week_number === targetWeek && s.year === targetYear);
        if (exists) {
            alert(`Lịch tuần ${targetWeek}/${targetYear} đã tồn tại!`);
            handleSelectSchedule(exists);
            setIsCreating(false);
            return;
        }

        try {
            const newSchedule = await createWeeklySchedule(targetWeek, targetYear);
            // Add and Resort
            const newReqs = [...schedules, newSchedule].sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.week_number - b.week_number;
            });
            setSchedules(newReqs);
            handleSelectSchedule(newSchedule);
            setIsCreating(false);
        } catch (err) { alert("Lỗi khi tạo lịch"); }
    };

    const handleRegister = async (shiftId: string, dateStr: string, targetUserId: string, note?: string) => {
        if (!selectedSchedule) return;
        try {
            const existing = registrations.find(r => r.user_id === targetUserId && r.date === dateStr);
            if (existing) {
                await deleteRegistration(existing.id, user?.id || "");
            }
            await registerShift(targetUserId, selectedSchedule.id, shiftId, dateStr, note);
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

    const handleDeleteAsset = async (type: 'banner' | 'poster') => {
        if (!selectedSchedule || !confirm("Bạn có chắc muốn xóa ảnh này?")) return;
        const updates: any = type === 'banner' ? { banner_url: null } : { poster_url: null };
        try {
            await updateWeeklySchedule(selectedSchedule.id, updates);
            const updatedSch = { ...selectedSchedule, ...updates };
            setSelectedSchedule(updatedSch);
            setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? updatedSch : s));
        } catch (err) { console.error(err); }
    };

    const handleUpdateTheme = async (color: string) => {
        if (!selectedSchedule) return;
        await updateWeeklySchedule(selectedSchedule.id, { theme_color: color });
        setSelectedSchedule({ ...selectedSchedule, theme_color: color });
        setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? { ...s, theme_color: color } : s));
        setShowColorPicker(false);
    };

    useEffect(() => {
        if (!selectedSchedule?.id) return;
        const channel = supabase.channel('hr_phase4_view')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_registrations', filter: `schedule_id=eq.${selectedSchedule.id}` },
                () => getShiftRegistrations(selectedSchedule.id).then(setRegistrations))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_schedules', filter: `id=eq.${selectedSchedule.id}` },
                (payload: any) => {
                    const newSch = payload.new as WeeklySchedule;
                    setSelectedSchedule(prev => prev?.id === newSch.id ? newSch : prev);
                    setSchedules(prev => prev.map(s => s.id === newSch.id ? newSch : s));
                })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [selectedSchedule?.id]);

    useEffect(() => { loadData(); }, []);

    // Helpers
    const getWeekDays = (week: number, year: number) => {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        // Adjust to Monday
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
    const themeColor = selectedSchedule?.theme_color || "#0d9488";

    const getShiftColor = (name: string) => {
        if (name.includes("Sáng")) return "bg-teal-50 text-teal-800 border-teal-200";
        if (name.includes("Chiều")) return "bg-orange-50 text-orange-800 border-orange-200";
        if (name.includes("Tối")) return "bg-indigo-50 text-indigo-800 border-indigo-200";
        return "bg-slate-50 text-slate-800 border-slate-200";
    };

    useEffect(() => {
        const handleClickOutside = () => {
            // Only close if we are not interacting with input? 
            // Actually, if we click outside the dropdown, close it.
            // Inside component we use stopPropagation so this is fine.
            setOpenDropdown(null);
        };
        if (openDropdown) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdown]);

    if (loading) return <div className="h-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} /></div>;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* 1. Assets Area (Full Width, Auto Height) */}
            <div className="shrink-0 flex flex-col md:flex-row border-b border-slate-200">
                {selectedSchedule && (
                    <div className="flex-1 relative group bg-slate-50">
                        {selectedSchedule.banner_url ? (
                            <img src={selectedSchedule.banner_url} className="w-full h-auto object-contain" style={{ maxHeight: '400px' }} />
                        ) : (
                            <div className="w-full h-32 flex items-center justify-center text-slate-400 text-xs">Chưa có Banner (tỷ lệ 3:1 hoặc 4:1)</div>
                        )}

                        {isHR && (
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], 'banner')} />
                                <button onClick={() => bannerInputRef.current?.click()} className="bg-white/90 p-1.5 rounded shadow hover:text-teal-600" title="Đổi Banner">
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                {selectedSchedule.banner_url && (
                                    <button onClick={() => handleDeleteAsset('banner')} className="bg-white/90 p-1.5 rounded shadow hover:text-red-600" title="Xóa Banner">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {/* Poster Side Area */}
                {selectedSchedule && (selectedSchedule.poster_url || isHR) && (
                    <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 relative group flex items-start justify-center bg-slate-50">
                        {selectedSchedule.poster_url ? (
                            <img src={selectedSchedule.poster_url} className="w-full h-auto object-contain" style={{ maxHeight: '400px' }} />
                        ) : (
                            <div className="h-32 flex items-center justify-center text-slate-400 text-xs text-center px-4">Poster/Thông báo</div>
                        )}
                        {isHR && (
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input type="file" ref={posterInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], 'poster')} />
                                <button onClick={() => posterInputRef.current?.click()} className="bg-white/90 p-1.5 rounded shadow hover:text-teal-600" title="Đổi Poster">
                                    <Upload className="w-4 h-4" />
                                </button>
                                {selectedSchedule.poster_url && (
                                    <button onClick={() => handleDeleteAsset('poster')} className="bg-white/90 p-1.5 rounded shadow hover:text-red-600" title="Xóa Poster">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Toolbar */}
            <div className="px-4 py-2 border-b border-slate-300 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold" style={{ color: themeColor }}>Lịch làm việc</h1>

                    {/* Week Buttons Sorted ASC */}
                    <div className="flex gap-1 overflow-x-auto max-w-[50vw] chrome-scrollbar-hidden">
                        {schedules.map(sch => (
                            <button
                                key={sch.id}
                                onClick={() => handleSelectSchedule(sch)}
                                className={`px-3 py-1 text-xs border rounded transition whitespace-nowrap font-medium ${selectedSchedule?.id === sch.id
                                        ? "text-white border-transparent shadow-sm"
                                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                                    }`}
                                style={selectedSchedule?.id === sch.id ? { backgroundColor: sch.theme_color || '#0d9488' } : {}}
                            >
                                Tuần {sch.week_number}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Custom Color Picker */}
                    {isHR && selectedSchedule && (
                        <div className="relative flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full overflow-hidden border border-slate-300 cursor-pointer relative shadow-sm hover:ring-2 hover:ring-offset-1 hover:ring-slate-300">
                                <input
                                    type="color"
                                    value={selectedSchedule.theme_color || '#0d9488'}
                                    onChange={(e) => handleUpdateTheme(e.target.value)}
                                    className="absolute inset-0 w-full h-full p-0 border-none opacity-0 cursor-pointer"
                                    title="Chọn màu chủ đạo"
                                />
                                <div className="w-full h-full" style={{ backgroundColor: selectedSchedule.theme_color || '#0d9488' }} />
                            </div>
                        </div>
                    )}

                    {/* New Week */}
                    {isHR && (
                        <div className="relative">
                            <button onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded shadow-sm hover:opacity-90" style={{ backgroundColor: themeColor }}>
                                <Plus className="w-3 h-3" /> Tuần mới
                            </button>
                            {isCreating && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <h3 className="text-sm font-bold text-slate-700 mb-3">Tạo lịch tuần mới</h3>
                                    <div className="mb-4">
                                        <label className="text-xs font-medium text-slate-600 block mb-1">Ngày bắt đầu (Thứ 2)</label>
                                        <input
                                            type="date"
                                            value={createDate}
                                            onChange={(e) => setCreateDate(e.target.value)}
                                            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 italic">
                                            Hệ thống sẽ tạo Tuần {createDate ? getISOWeek(new Date(createDate)) : '...'} - Năm {createDate ? getYear(new Date(createDate)) : '...'}
                                        </p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded">Hủy</button>
                                        <button onClick={handleCreateWithDate} className="px-3 py-1.5 text-xs font-medium text-white rounded shadow-sm hover:opacity-90" style={{ backgroundColor: themeColor }}>Xác nhận</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Grid Table */}
            <div className="flex-1 overflow-auto bg-white relative">
                {selectedSchedule ? (
                    <table className="w-full border-collapse text-sm mb-12">
                        <thead className="sticky top-0 z-30 text-white shadow-md" style={{ backgroundColor: themeColor }}>
                            <tr>
                                <th className="sticky left-0 z-40 border-r border-b border-white/20 py-2 px-3 w-48 text-left text-xs font-semibold" style={{ backgroundColor: themeColor }}>Nhân viên</th>
                                {weekDays.map((date, idx) => (
                                    <th key={idx} className="border-r border-b border-white/20 py-2 px-2 min-w-[120px] text-center">
                                        <div className="text-[10px] uppercase opacity-80">{DAY_NAMES[idx]}</div>
                                        <div className="font-bold">{format(date, 'dd/MM')}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((profile, rowIdx) => {
                                // Striped rows for better readability
                                const rowBg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';

                                return (
                                    <tr key={profile.id} className={`${rowBg} hover:bg-slate-50`}>
                                        <td className={`sticky left-0 z-20 ${rowBg} border border-slate-300 px-3 py-1 h-12 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                                            <div className="flex items-center gap-2 truncate">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 border border-slate-200 shadow-sm">
                                                    {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" /> : profile.full_name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className="text-xs font-medium text-slate-900 truncate">{profile.full_name}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {weekDays.map((date, dayIdx) => {
                                            const dateStr = format(date, 'yyyy-MM-dd');
                                            const reg = registrations.find(r => r.user_id === profile.id && r.date === dateStr);
                                            const isOpen = selectedSchedule.status === 'open';
                                            const canAction = isHR || (user?.id === profile.id && isOpen);
                                            const isDropdownOpen = openDropdown?.userId === profile.id && openDropdown?.date === dateStr;

                                            return (
                                                <td
                                                    key={dayIdx}
                                                    className={`border border-slate-300 p-1 h-12 relative align-top ${canAction ? 'cursor-pointer hover:bg-black/5' : ''}`}
                                                    onClick={(e) => {
                                                        if (canAction && !isDropdownOpen) {
                                                            setOpenDropdown({ userId: profile.id, date: dateStr });
                                                            setNoteValue(reg?.note || "");
                                                        }
                                                    }}
                                                >
                                                    {reg ? (
                                                        <div className={`w-full h-full rounded px-2 py-1 flex flex-col justify-center shadow-sm relative overflow-hidden group/cell ${getShiftColor(reg.shift?.name || "")}`}>
                                                            {/* Only show '...' if there's a note but space is tight? No, show icon */}
                                                            <div className="flex justify-between items-start">
                                                                <div className="text-[11px] font-bold leading-tight">{reg.shift?.name}</div>
                                                                {reg.note && <MessageSquare className="w-2.5 h-2.5 opacity-60 ml-1 shrink-0" />}
                                                            </div>
                                                            {reg.note && (
                                                                <div className="text-[9px] opacity-75 truncate mt-0.5">{reg.note}</div>
                                                            )}
                                                        </div>
                                                    ) : (<div className="w-full h-full"></div>)}

                                                    {/* Dropdown Popup */}
                                                    {isDropdownOpen && (
                                                        <div
                                                            className="absolute top-full left-0 z-50 w-56 bg-white border border-slate-200 shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <div className="px-3 py-2 text-[10px] bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 flex justify-between items-center">
                                                                <span>{profile.full_name} - {format(date, 'dd/MM')}</span>
                                                                <button onClick={() => setOpenDropdown(null)} className="hover:bg-slate-200 p-1 rounded-full"><X className="w-3 h-3 hover:text-red-500" /></button>
                                                            </div>

                                                            <div className="p-1.5 space-y-1 max-h-40 overflow-y-auto">
                                                                {shifts.map(shift => (
                                                                    <button
                                                                        key={shift.id}
                                                                        className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-teal-50 hover:text-teal-700 flex items-center justify-between transition-colors ${reg?.shift_id === shift.id ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700'}`}
                                                                        onClick={() => handleRegister(shift.id, dateStr, profile.id, noteValue)}
                                                                    >
                                                                        <span>{shift.name}</span>
                                                                        <span className="text-[10px] text-slate-400 font-normal">{shift.start_time.slice(0, 5)}</span>
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <div className="p-2 border-t border-slate-100 bg-slate-50">
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    placeholder="Ghi chú (nhập rồi Enter)..."
                                                                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none mb-2 bg-white"
                                                                    value={noteValue}
                                                                    onChange={(e) => setNoteValue(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            if (reg) handleRegister(reg.shift_id, dateStr, profile.id, noteValue);
                                                                            // If no reg, user needs to pick shift first, but typically they might pick shift then type note.
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="flex justify-between items-center">
                                                                    {reg ? (
                                                                        <button onClick={() => handleClearShift(reg.id)} className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Hủy ca</button>
                                                                    ) : <span></span>}
                                                                    {reg && (
                                                                        <button onClick={() => handleRegister(reg.shift_id, dateStr, profile.id, noteValue)} className="text-[10px] bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700 font-medium">Lưu note</button>
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
                    <div className="h-full flex items-center justify-center text-slate-400">Chọn hoặc tạo lịch làm việc</div>
                )}
            </div>
        </div>
    );
}
