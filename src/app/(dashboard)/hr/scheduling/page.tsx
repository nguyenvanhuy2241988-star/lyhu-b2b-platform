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
    Plus, Loader2, Upload, Edit3, MessageSquare, X, Palette, Trash2, Check, ExternalLink, Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useHRLayout } from "@/components/hr/HRLayoutContext";

export default function HRSchedulingPage() {
    const { user, role } = useAuth();
    const isAdmin = role === ROLES.ADMIN || role === ROLES.RECRUITER;
    const isHR = isAdmin;

    // Context
    const { setPosters, setThemeColor } = useHRLayout();

    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<HRProfile[]>([]);
    const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<WeeklySchedule | null>(null);
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);

    const [uploadingBanner, setUploadingBanner] = useState(false);
    // Poster management state
    const [showPosterModal, setShowPosterModal] = useState(false);

    const [createDate, setCreateDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isCreating, setIsCreating] = useState(false);

    const [openDropdown, setOpenDropdown] = useState<{ userId: string, date: string } | null>(null);
    const [noteValue, setNoteValue] = useState("");

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const poster1InputRef = useRef<HTMLInputElement>(null);
    const poster2InputRef = useRef<HTMLInputElement>(null);
    const poster3InputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profilesData, schedulesData, shiftsData] = await Promise.all([
                getHRProfiles(),
                getWeeklySchedules(),
                getWorkShifts()
            ]);
            setProfiles(profilesData);

            // Sort schedules: Year Asc, Week Asc
            const sortedSchedules = schedulesData.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.week_number - b.week_number;
            });
            setSchedules(sortedSchedules);
            setShifts(shiftsData);

            if (sortedSchedules.length > 0) {
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
        // Sync to context (Array of 3)
        setPosters([schedule.poster_url || null, schedule.poster_url_2 || null, schedule.poster_url_3 || null]);

        if (schedule.theme_color) setThemeColor(schedule.theme_color);
        else setThemeColor("#0d9488");

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

    const handleAssetUpload = async (file: File, type: 'banner' | 'poster' | 'poster2' | 'poster3') => {
        if (!selectedSchedule) return;
        if (type === 'banner') setUploadingBanner(true);
        try {
            const publicUrl = await uploadHRAsset(file);
            let updates: any = {};
            if (type === 'banner') updates = { banner_url: publicUrl };
            if (type === 'poster') updates = { poster_url: publicUrl };
            if (type === 'poster2') updates = { poster_url_2: publicUrl };
            if (type === 'poster3') updates = { poster_url_3: publicUrl };

            await updateWeeklySchedule(selectedSchedule.id, updates);

            const updatedSch = { ...selectedSchedule, ...updates };
            setSelectedSchedule(updatedSch);
            setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? updatedSch : s));

            // Sync context
            if (type !== 'banner') {
                const p1 = type === 'poster' ? publicUrl : (updatedSch.poster_url || null);
                const p2 = type === 'poster2' ? publicUrl : (updatedSch.poster_url_2 || null);
                const p3 = type === 'poster3' ? publicUrl : (updatedSch.poster_url_3 || null);
                setPosters([p1, p2, p3]);
            }

        } catch (err) { alert("Upload failed"); }
        finally { setUploadingBanner(false); }
    };

    const handleDeleteAsset = async (type: 'banner' | 'poster' | 'poster2' | 'poster3') => {
        if (!selectedSchedule || !confirm("Bạn có chắc muốn xóa ảnh này?")) return;
        let updates: any = {};
        if (type === 'banner') updates = { banner_url: null };
        if (type === 'poster') updates = { poster_url: null };
        if (type === 'poster2') updates = { poster_url_2: null };
        if (type === 'poster3') updates = { poster_url_3: null };

        try {
            await updateWeeklySchedule(selectedSchedule.id, updates);
            const updatedSch = { ...selectedSchedule, ...updates };
            setSelectedSchedule(updatedSch);
            setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? updatedSch : s));
            // Sync context
            if (type !== 'banner') {
                const p1 = type === 'poster' ? null : (updatedSch.poster_url || null);
                const p2 = type === 'poster2' ? null : (updatedSch.poster_url_2 || null);
                const p3 = type === 'poster3' ? null : (updatedSch.poster_url_3 || null);
                setPosters([p1, p2, p3]);
            }
        } catch (err) { console.error(err); }
    };

    const handleUpdateTheme = async (color: string) => {
        if (!selectedSchedule) return;
        await updateWeeklySchedule(selectedSchedule.id, { theme_color: color });
        setSelectedSchedule({ ...selectedSchedule, theme_color: color });
        setSchedules(prev => prev.map(s => s.id === selectedSchedule.id ? { ...s, theme_color: color } : s));
        setThemeColor(color);
    };

    useEffect(() => {
        if (selectedSchedule) {
            setPosters([selectedSchedule.poster_url || null, selectedSchedule.poster_url_2 || null, selectedSchedule.poster_url_3 || null]);
            setThemeColor(selectedSchedule.theme_color || '#0d9488');
        }
    }, [selectedSchedule]);

    useEffect(() => {
        if (!selectedSchedule?.id) return;
        const channel = supabase.channel('hr_phase6_view')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_registrations', filter: `schedule_id=eq.${selectedSchedule.id}` },
                () => getShiftRegistrations(selectedSchedule.id).then(setRegistrations))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_schedules', filter: `id=eq.${selectedSchedule.id}` },
                (payload: any) => {
                    const newSch = payload.new as WeeklySchedule;
                    setSelectedSchedule(prev => prev?.id === newSch.id ? newSch : prev);
                    setSchedules(prev => prev.map(s => s.id === newSch.id ? newSch : s));
                    if (newSch.id === selectedSchedule.id) {
                        setPosters([newSch.poster_url || null, newSch.poster_url_2 || null, newSch.poster_url_3 || null]);
                        if (newSch.theme_color) setThemeColor(newSch.theme_color);
                    }
                })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [selectedSchedule?.id]);

    useEffect(() => { loadData(); }, []);

    // Helpers
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
    const themeColor = selectedSchedule?.theme_color || "#0d9488";

    const getShiftColor = (name: string) => {
        if (name.includes("Sáng")) return "bg-teal-50 text-teal-800 border-teal-200";
        if (name.includes("Chiều")) return "bg-orange-50 text-orange-800 border-orange-200";
        if (name.includes("Tối")) return "bg-indigo-50 text-indigo-800 border-indigo-200";
        return "bg-slate-50 text-slate-800 border-slate-200";
    };

    // Close on click outside (but component handles stopPropagation)
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null);
        if (openDropdown) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdown]);

    if (loading) return <div className="h-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} /></div>;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* 1. Banner Area */}
            <div className="shrink-0 relative group bg-slate-50 border-b border-slate-200 w-full">
                {selectedSchedule && (
                    <>
                        {selectedSchedule.banner_url ? (
                            <img src={selectedSchedule.banner_url} className="w-full h-auto object-cover md:object-contain bg-white" style={{ maxHeight: '450px' }} />
                        ) : (
                            <div className="w-full h-32 flex items-center justify-center text-slate-400 text-xs">Chưa có Banner (Full Width)</div>
                        )}

                        {isHR && (
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded backdrop-blur-sm">
                                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], 'banner')} />
                                <button onClick={() => bannerInputRef.current?.click()} className="bg-white p-1.5 rounded shadow hover:text-teal-600" title="Đổi Banner">
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                {selectedSchedule.banner_url && (
                                    <button onClick={() => handleDeleteAsset('banner')} className="bg-white p-1.5 rounded shadow hover:text-red-600" title="Xóa Banner">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 2. Toolbar */}
            <div className="px-4 py-2 border-b border-slate-300 flex flex-col md:flex-row md:items-center justify-between bg-slate-50 shrink-0 gap-2">
                <div className="flex items-center gap-4 overflow-x-auto chrome-scrollbar-hidden py-1">
                    <h1 className="text-lg font-bold whitespace-nowrap" style={{ color: themeColor }}>Lịch làm việc</h1>

                    {/* Week Buttons */}
                    <div className="flex gap-1">
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

                <div className="flex items-center gap-3 self-end md:self-auto">
                    {/* Poster Management Modal Trigger */}
                    {isHR && selectedSchedule && (
                        <div className="relative">
                            <button
                                onClick={() => setShowPosterModal(!showPosterModal)}
                                className="flex items-center gap-1 text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50"
                            >
                                <ImageIcon className="w-3.5 h-3.5" /> Quản lý Poster ({[selectedSchedule.poster_url, selectedSchedule.poster_url_2, selectedSchedule.poster_url_3].filter(Boolean).length}/3)
                            </button>

                            {/* Modal/Popover for 3 Posters */}
                            {showPosterModal && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-lg p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-slate-700">Quản lý Poster (Sidebar)</h3>
                                        <button onClick={() => setShowPosterModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Slot 1 */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 mb-1">Poster 1</p>
                                            {selectedSchedule.poster_url ? (
                                                <div className="relative group rounded border border-slate-200 overflow-hidden">
                                                    <img src={selectedSchedule.poster_url} className="w-full h-24 object-contain bg-slate-50" />
                                                    <div className="absolute top-1 right-1 flex gap-1">
                                                        <button onClick={() => handleDeleteAsset('poster')} className="bg-white/80 p-1 text-red-600 rounded shadow"><Trash2 className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => poster1InputRef.current?.click()} className="w-full h-20 border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-slate-400 hover:bg-slate-50">Upload Poster 1</button>
                                            )}
                                        </div>
                                        {/* Slot 2 */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 mb-1">Poster 2</p>
                                            {selectedSchedule.poster_url_2 ? (
                                                <div className="relative group rounded border border-slate-200 overflow-hidden">
                                                    <img src={selectedSchedule.poster_url_2} className="w-full h-24 object-contain bg-slate-50" />
                                                    <div className="absolute top-1 right-1 flex gap-1">
                                                        <button onClick={() => handleDeleteAsset('poster2')} className="bg-white/80 p-1 text-red-600 rounded shadow"><Trash2 className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => poster2InputRef.current?.click()} className="w-full h-20 border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-slate-400 hover:bg-slate-50">Upload Poster 2</button>
                                            )}
                                        </div>
                                        {/* Slot 3 */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 mb-1">Poster 3</p>
                                            {selectedSchedule.poster_url_3 ? (
                                                <div className="relative group rounded border border-slate-200 overflow-hidden">
                                                    <img src={selectedSchedule.poster_url_3} className="w-full h-24 object-contain bg-slate-50" />
                                                    <div className="absolute top-1 right-1 flex gap-1">
                                                        <button onClick={() => handleDeleteAsset('poster3')} className="bg-white/80 p-1 text-red-600 rounded shadow"><Trash2 className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => poster3InputRef.current?.click()} className="w-full h-20 border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-slate-400 hover:bg-slate-50">Upload Poster 3</button>
                                            )}
                                        </div>
                                    </div>

                                    {/* HIDDEN INPUTS */}
                                    <input type="file" ref={poster1InputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], 'poster')} />
                                    <input type="file" ref={poster2InputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], 'poster2')} />
                                    <input type="file" ref={poster3InputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], 'poster3')} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Color Picker */}
                    {isHR && selectedSchedule && (
                        <div className="h-7 w-7 rounded-full overflow-hidden border border-slate-300 cursor-pointer relative shadow-sm hover:scale-105 transition-transform">
                            <input
                                type="color"
                                value={selectedSchedule.theme_color || '#0d9488'}
                                onChange={(e) => handleUpdateTheme(e.target.value)}
                                className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] p-0 border-none opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-full pointer-events-none" style={{ backgroundColor: selectedSchedule.theme_color || '#0d9488' }} />
                        </div>
                    )}

                    {/* New Week */}
                    {isHR && (
                        <div className="relative">
                            <button onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded shadow-sm hover:opacity-90 h-7" style={{ backgroundColor: themeColor }}>
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
                                                        <div className={`w-full h-full rounded px-2 py-1 flex flex-col justify-center shadow-sm relative overflow-hidden ${getShiftColor(reg.shift?.name || "")}`}>
                                                            <div className="flex justify-between items-start">
                                                                <div className="text-[10px] font-normal opacity-75 leading-tight">{reg.shift?.name}</div>
                                                                {reg.note && <MessageSquare className="w-2.5 h-2.5 opacity-60 ml-1 shrink-0" />}
                                                            </div>
                                                            {reg.note && (
                                                                <div className="text-xs font-bold mt-0.5 break-words leading-tight text-slate-900">{reg.note}</div>
                                                            )}
                                                        </div>
                                                    ) : (<div className="w-full h-full"></div>)}

                                                    {/* Dropdown Popup */}
                                                    {isDropdownOpen && (
                                                        <div
                                                            className="absolute top-full left-0 z-50 w-64 bg-white border border-slate-200 shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <div className="px-3 py-2 text-[10px] bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 flex justify-between items-center">
                                                                <span>{profile.full_name} - {format(date, 'dd/MM')}</span>
                                                                <button onClick={() => setOpenDropdown(null)} className="hover:bg-slate-200 p-1 rounded-full"><X className="w-3 h-3 hover:text-red-500" /></button>
                                                            </div>

                                                            <div className="p-1.5 grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                                                                {shifts.map(shift => (
                                                                    <button
                                                                        key={shift.id}
                                                                        className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-teal-50 hover:text-teal-700 flex items-center justify-between transition-colors ${reg?.shift_id === shift.id ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700'}`}
                                                                        onClick={() => handleRegister(shift.id, dateStr, profile.id, noteValue)}
                                                                    >
                                                                        <span className="font-medium">{shift.name}</span>
                                                                        <span className="text-[10px] text-slate-400 font-normal">{shift.start_time.slice(0, 5)}</span>
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <div className="p-2 border-t border-slate-100 bg-slate-50">
                                                                <div className="space-y-2">
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        placeholder="Nhập ghi chú..."
                                                                        className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-teal-500 outline-none bg-white"
                                                                        value={noteValue}
                                                                        onChange={(e) => setNoteValue(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' && reg) handleRegister(reg.shift_id, dateStr, profile.id, noteValue);
                                                                            // If no Reg, user can't save note yet.
                                                                        }}
                                                                    />
                                                                    <div className="flex justify-between items-center gap-2">
                                                                        {reg ? (
                                                                            <button
                                                                                onClick={() => handleClearShift(reg.id)}
                                                                                className="flex-1 py-1.5 text-[10px] bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded flex items-center justify-center gap-1"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" /> Hủy
                                                                            </button>
                                                                        ) : (<div className="flex-1 py-1.5"></div>)}

                                                                        <button
                                                                            onClick={() => {
                                                                                if (reg) handleRegister(reg.shift_id, dateStr, profile.id, noteValue);
                                                                                else alert("Vui lòng chọn Ca làm việc trước khi lưu ghi chú!");
                                                                            }}
                                                                            className="flex-1 py-1.5 text-[10px] bg-teal-600 text-white hover:bg-teal-700 rounded flex items-center justify-center gap-1 font-medium"
                                                                        >
                                                                            <Check className="w-3 h-3" /> Lưu
                                                                        </button>
                                                                    </div>
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
