"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import {
    WeeklySchedule, WorkShift, ShiftRegistration,
    getWeeklySchedules, getWorkShifts, getShiftRegistrations,
    createWeeklySchedule, registerShift, deleteRegistration
} from "@/lib/hrStore";
import { format, startOfWeek, addDays, getISOWeek, getYear } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";

export default function HRSchedulingPage() {
    const { user, role } = useAuth();
    const isAdmin = role === ROLES.ADMIN;

    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<WeeklySchedule | null>(null);
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);

    // Setup for current week view or creating new
    const today = new Date();
    const currentWeekInfo = { week: getISOWeek(today), year: getYear(today) };

    const loadData = async () => {
        setLoading(true);
        try {
            const [schedulesData, shiftsData] = await Promise.all([
                getWeeklySchedules(),
                getWorkShifts()
            ]);
            setSchedules(schedulesData);
            setShifts(shiftsData);

            // Auto select latest open schedule or create simple view
            if (schedulesData.length > 0) {
                // If we have schedules, pick the first one (most recent)
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
        // Load registrations for this schedule
        try {
            const regs = await getShiftRegistrations(schedule.id);
            setRegistrations(regs);
        } catch (err) {
            console.error("Failed to load registrations", err);
        }
    };

    const handleCreateWeek = async () => {
        // Create schedule for next week (or current if missing)
        // Simplification: asking user or just default to next week
        // For Demo: Use current week + 1
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

    const handleRegister = async (shiftId: string, dateStr: string) => {
        if (!selectedSchedule || !user) return;
        try {
            await registerShift(user.id, selectedSchedule.id, shiftId, dateStr);
            // Refresh
            handleSelectSchedule(selectedSchedule);
        } catch (err) {
            console.error("Register failed", err);
            alert("Đăng ký không thành công.");
        }
    };

    const handleCancel = async (regId: string) => {
        if (!selectedSchedule || !user) return;
        try {
            await deleteRegistration(regId, user.id);
            handleSelectSchedule(selectedSchedule);
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    // Helper to generate days of the selected week
    const getDays InWeek = (week: number, year: number) => {
        // Calculate start date of ISO week
        // This is complex in JS native. date-fns simplified:
        // But getISOWeek is read-only. We need to construct date from week/year.
        // Approx approach for UI:
        // We know week number. 
        // Let's just mock dates for simplicity if pure calc is hard without external lib extensions
        // Actually date-fns has setISOWeek
        // For MVP: Let's assume we render "Thứ 2" -> "CN" regardless of exact date numbers if vague?
        // No, we need dates for DB.

        // Simple trick: first week of year + (week-1) weeks
        // Adjust logic later if precise date needed.
        // Better: let's just use current week if matching, else show relative days.

        // Correct implementation:
        // Monday of given week:
        // const start = parseISO(`${year}-W${week.toString().padStart(2, '0')}-1`);
        // We will just return indices 0-6 (Mon-Sun) and let UI render
        // Inside render, we compute actual date string for DB
        return Array.from({ length: 7 }, (_, i) => i); // 0=Mon, 6=Sun
    };

    // Calculate actual date string (YYYY-MM-DD) for a specific day index in the selected schedule
    const getDateStringForDay = (dayIndex: number) => {
        if (!selectedSchedule) return "";
        // This logic is tricky without proper ISO week parsing.
        // For MVP, if we just created "Next Week", we can cache the start date?
        // Let's assume the user IS creating for "Week X".
        // Let's keep it simple: We store date in DB. 
        // For UI, we need to generate correct YYYY-MM-DD.
        // Let's use a helper or library function if strict.

        // Simple workaround for demo purpose if ISO calc is heavy:
        // Just rely on the fact that if it's "Current Week", we know dates.
        // If "Next Week", we add 7 days.
        return `2026-0${dayIndex + 1}-01`; // Placeholder for now to prevent broken logic loops.
        // REAL IMPLEMENTATION NEEDED:
        // We will use a library or stronger helper in v2.
        // For now, let's just check if user has registered for "Day X" by checking the date field loosely?
        // Or store "day_of_week" instead of date? 
        // The DB Schema says 'date' (type date).
        // Let's fix this properly.
    };

    // Correct way to get dates from ISO Week/Year:
    const getWeekDays = (week: number, year: number) => {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dayOfWeek = simple.getDay();
        const ISOweekStart = simple;
        if (dayOfWeek <= 4)
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(ISOweekStart);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = selectedSchedule ? getWeekDays(selectedSchedule.week_number, selectedSchedule.year) : [];
    const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Xếp lịch làm việc</h1>
                    <p className="text-sm text-slate-500">Đăng ký ca làm việc theo tuần</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleCreateWeek}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm shadow-blue-200"
                    >
                        <Plus className="w-4 h-4" />
                        Mở đăng ký tuần tới
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
                {/* Schedule Selector */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                    {schedules.map(sch => (
                        <button
                            key={sch.id}
                            onClick={() => handleSelectSchedule(sch)}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-medium transition ${selectedSchedule?.id === sch.id
                                    ? "bg-white border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-100"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            Tuần {sch.week_number} ({sch.year})
                            <span className={`ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded ${sch.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500 frame'
                                }`}>
                                {sch.status}
                            </span>
                        </button>
                    ))}
                    {schedules.length === 0 && (
                        <div className="text-slate-500 text-sm italic py-2">Chưa có đợt đăng ký nào. Admin hãy tạo mới!</div>
                    )}
                </div>

                {selectedSchedule && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[100px]">Ca làm việc</th>
                                        {weekDays.map((date, idx) => (
                                            <th key={idx} className="px-4 py-3 min-w-[140px]">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{DAY_NAMES[idx]}</span>
                                                    <span className="text-xs font-normal">{format(date, 'dd/MM')}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {shifts.map(shift => (
                                        <tr key={shift.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-700 bg-slate-50/30">
                                                <div>{shift.name}</div>
                                                <div className="text-xs text-slate-400 font-normal">
                                                    {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                                                </div>
                                            </td>
                                            {weekDays.map((date, dayIdx) => {
                                                const dateStr = format(date, 'yyyy-MM-dd');
                                                // Find if User has registered
                                                const myReg = registrations.find(
                                                    r => r.shift_id === shift.id &&
                                                        r.date === dateStr &&
                                                        r.user_id === user?.id
                                                );

                                                // Find total count (for Admin view - later)
                                                // For now just show "Register" button

                                                return (
                                                    <td key={dayIdx} className="px-4 py-3 border-l border-slate-50">
                                                        {myReg ? (
                                                            <div className={`p-2 rounded border text-xs font-medium flex justify-between items-center ${myReg.status === 'approved'
                                                                    ? 'bg-green-50 border-green-200 text-green-700'
                                                                    : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                                                }`}>
                                                                <span>{myReg.status === 'pending' ? 'Đang chờ' : 'Đã duyệt'}</span>
                                                                {myReg.status === 'pending' && (
                                                                    <button
                                                                        onClick={() => handleCancel(myReg.id)}
                                                                        className="text-slate-400 hover:text-red-500 ml-2"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            selectedSchedule.status === 'open' ? (
                                                                <button
                                                                    onClick={() => handleRegister(shift.id, dateStr)}
                                                                    className="w-full py-1.5 border border-dashed border-slate-300 rounded text-slate-400 text-xs hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition"
                                                                >
                                                                    + Đăng ký
                                                                </button>
                                                            ) : (
                                                                <span className="text-slate-300 text-xs">-</span>
                                                            )
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
