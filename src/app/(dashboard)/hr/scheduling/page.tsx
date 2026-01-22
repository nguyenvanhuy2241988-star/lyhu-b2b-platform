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
// ... existing imports
import { X, Check, User as UserIcon } from "lucide-react";
import { updateRegistrationStatus } from "@/lib/hrStore";
import { supabase } from "@/lib/supabaseClient";

// Modal Component for Admin Approvals
function ShiftApprovalsModal({
    isOpen, onClose, shift, date, registrations, onUpdate
}: {
    isOpen: boolean;
    onClose: () => void;
    shift: WorkShift | null;
    date: Date | null;
    registrations: ShiftRegistration[];
    onUpdate: () => void;
}) {
    if (!isOpen || !shift || !date) return null;

    const dateStr = format(date, 'dd/MM/yyyy');

    const handleApprove = async (regId: string) => {
        try {
            await updateRegistrationStatus(regId, 'approved');
            onUpdate();
        } catch (e) {
            console.error(e);
            alert("Lỗi khi duyệt");
        }
    };

    const handleReject = async (regId: string) => {
        if (!confirm("Từ chối nhân sự này?")) return;
        try {
            await updateRegistrationStatus(regId, 'rejected'); // Or delete
            onUpdate();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800">{shift.name}</h3>
                        <p className="text-xs text-slate-500">{dateStr} • {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="p-0 max-h-[60vh] overflow-y-auto">
                    {registrations.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            Chưa có nhân sự nào đăng ký ca này.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {registrations.map(reg => (
                                <div key={reg.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600 font-bold text-xs">
                                                {reg.user?.full_name?.charAt(0) || "U"}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{reg.user?.full_name || "Unknown"}</div>
                                            <div className={`text-[10px] uppercase font-bold ${reg.status === 'approved' ? 'text-green-600' :
                                                reg.status === 'rejected' ? 'text-red-500' : 'text-yellow-600'
                                                }`}>
                                                {reg.status === 'pending' ? 'Chờ duyệt' :
                                                    reg.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {reg.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(reg.id)}
                                                    className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition"
                                                    title="Duyệt"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(reg.id)}
                                                    className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition"
                                                    title="Từ chối"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {reg.status === 'approved' && (
                                            <span className="text-green-500"><Check className="w-5 h-5" /></span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HRSchedulingPage() {
    const { user, role } = useAuth();
    const isAdmin = role === ROLES.ADMIN || role === ROLES.RECRUITER; // Allow HR/Recruiter too

    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<WeeklySchedule | null>(null);
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{ shift: WorkShift, date: Date, regs: ShiftRegistration[] } | null>(null);

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

    // Initial Data Load
    useEffect(() => {
        loadData();
    }, []);

    // Realtime Subscription (Data Refresh)
    useEffect(() => {
        const channel = supabase
            .channel('hr_scheduling_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'shift_registrations'
            }, () => {
                // If a schedule is selected, refresh its registrations
                // Use functional update or ref if needed, but here simple refetch is fine
                // We access selectedSchedule from closure. Logic warning: closure staleness.
                // Better approach: just re-fetch registrations for currently selected ID if valid.
                if (selectedSchedule?.id) {
                    getShiftRegistrations(selectedSchedule.id).then(setRegistrations);
                }
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'weekly_schedules'
            }, () => {
                // Refresh schedules list
                // We should call a lighter version of loadData or just refetch schedules
                getWeeklySchedules().then(setSchedules);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedSchedule?.id]);

    if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    const openAdminModal = (shift: WorkShift, date: Date) => {
        if (!isAdmin) return;
        const dateStr = format(date, 'yyyy-MM-dd');
        // Filter registrations for this specific cell
        const cellRegs = registrations.filter(r =>
            r.shift_id === shift.id && r.date === dateStr
        );
        setModalData({ shift, date, regs: cellRegs });
        setModalOpen(true);
    };

    // Helper to generate days of the selected week
    const getDaysInWeek = (week: number, year: number) => {
        return Array.from({ length: 7 }, (_, i) => i);
    };

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
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreateWeek}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" />
                            Mở đăng ký tuần tới
                        </button>
                    </div>
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
                                                // Check registrations for this cell
                                                const cellRegs = registrations.filter(r =>
                                                    r.shift_id === shift.id && r.date === dateStr
                                                );

                                                // My registration
                                                const myReg = cellRegs.find(r => r.user_id === user?.id);

                                                // Approval metrics (Admin)
                                                const pendingCount = cellRegs.filter(r => r.status === 'pending').length;
                                                const approvedCount = cellRegs.filter(r => r.status === 'approved').length;

                                                return (
                                                    <td key={dayIdx} className="px-4 py-3 border-l border-slate-50 relative group h-14">
                                                        {isAdmin ? (
                                                            // ADMIN VIEW: Show Count & Click to Open Modal, BUT also allow self-register
                                                            <div className="w-full h-full flex flex-col gap-1">
                                                                {/* Admin Stats Button */}
                                                                <button
                                                                    onClick={() => openAdminModal(shift, date)}
                                                                    className={`flex-1 w-full rounded flex items-center justify-center gap-1 transition-colors text-[10px] ${cellRegs.length > 0 ? "bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold" : "bg-slate-50 hover:bg-slate-100 text-slate-400"
                                                                        }`}
                                                                >
                                                                    {cellRegs.length > 0 ? (
                                                                        <>
                                                                            <span>{cellRegs.length} NS</span>
                                                                            {pendingCount > 0 && <span className="bg-yellow-200 text-yellow-800 px-1 rounded-full">{pendingCount}</span>}
                                                                        </>
                                                                    ) : (
                                                                        <span>Xem</span>
                                                                    )}
                                                                </button>

                                                                {myReg ? (
                                                                    <div className={`text-[10px] text-center px-1 rounded border flex items-center justify-between ${myReg.status === 'approved' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                                                                        <span className="truncate">Bạn: {myReg.status === 'approved' ? 'Đã duyệt' : 'Chờ'}</span>
                                                                        {myReg.status === 'pending' && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleCancel(myReg.id);
                                                                                }}
                                                                                className="ml-1 p-0.5 hover:bg-red-100 hover:text-red-500 rounded text-slate-400"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    selectedSchedule.status === 'open' && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRegister(shift.id, dateStr);
                                                                            }}
                                                                            className="h-6 w-full border border-dashed border-blue-300 rounded text-blue-600 bg-blue-50/50 text-[10px] hover:bg-blue-100 font-medium transition flex items-center justify-center"
                                                                        >
                                                                            + Đăng ký
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        ) : (
                                                            // EMPLOYEE VIEW: Show My Status or Register Button
                                                            <>
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
                                                            </>
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

            {/* Admin Approval Modal */}
            {modalOpen && modalData && (
                <ShiftApprovalsModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    shift={modalData.shift}
                    date={modalData.date}
                    registrations={modalData.regs}
                    onUpdate={() => {
                        if (selectedSchedule) {
                            getShiftRegistrations(selectedSchedule.id).then((regs) => {
                                setRegistrations(regs);
                                // Sync modal data
                                const dateStr = format(modalData.date, 'yyyy-MM-dd');
                                const updatedCellRegs = regs.filter(r =>
                                    r.shift_id === modalData.shift.id && r.date === dateStr
                                );
                                setModalData(prev => prev ? ({ ...prev, regs: updatedCellRegs }) : null);
                            });
                        }
                    }}
                />
            )}
        </div>
    );
}
