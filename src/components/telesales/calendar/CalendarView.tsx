"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Phone, AlertCircle, CheckCircle2 } from "lucide-react";
import { ScheduledTask, fetchScheduledTasks } from "@/lib/crmDealsStore";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

export default function CalendarView() {
    const { user, session } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch tasks for the current month view
    useEffect(() => {
        if (!user || !session?.access_token) return;

        const loadTasks = async () => {
            setIsLoading(true);
            const start = startOfWeek(startOfMonth(currentDate));
            const end = endOfWeek(endOfMonth(currentDate));
            const data = await fetchScheduledTasks(start, end, user.id, session.access_token);
            setTasks(data);
            setIsLoading(false);
        };

        loadTasks();
    }, [currentDate, user, session]);

    // Calendar Navigation
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Generate Calendar Grid
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Filter tasks for selected date
    const selectedDateTasks = tasks.filter(task => isSameDay(new Date(task.next_action_at), selectedDate));
    // Sort by time
    selectedDateTasks.sort((a, b) => new Date(a.next_action_at).getTime() - new Date(b.next_action_at).getTime());

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6">
            {/* Calendar Main Area */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-slate-900 capitalize">
                            {format(currentDate, "MMMM yyyy", { locale: vi })}
                        </h2>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button onClick={prevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500 hover:text-slate-900">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={nextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500 hover:text-slate-900">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                        Hôm nay
                    </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px border-b border-slate-200">
                    {calendarDays.map((day, idx) => {
                        const dayTasks = tasks.filter(t => isSameDay(new Date(t.next_action_at), day));
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={`bg-white min-h-[100px] p-2 cursor-pointer transition-colors relative hover:bg-slate-50
                                    ${!isCurrentMonth ? "bg-slate-50/50 text-slate-400" : "text-slate-900"}
                                    ${isSelected ? "ring-2 ring-inset ring-primary-500 z-10" : ""}
                                `}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                        ${isTodayDate ? "bg-red-500 text-white" : ""}
                                    `}>
                                        {format(day, "d")}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {dayTasks.slice(0, 3).map((task) => (
                                        <div key={task.id} className="text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1
                                            bg-blue-50 border-blue-100 text-blue-700
                                        ">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                            {format(new Date(task.next_action_at), "HH:mm")} - {task.customer_name}
                                        </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <div className="text-[10px] text-slate-400 font-medium pl-1">
                                            + {dayTasks.length - 3} việc khác
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sidebar Details */}
            <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px] lg:h-auto">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-primary-600" />
                        Lịch trình ngày {format(selectedDate, "dd/MM/yyyy")}
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-400">Đang tải lịch...</div>
                    ) : selectedDateTasks.length > 0 ? (
                        selectedDateTasks.map((task) => (
                            <div key={task.id} className="p-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-1 rounded">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(task.next_action_at), "HH:mm")}
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold
                                        ${task.source_type === 'task' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                            task.status === 'won' ? 'bg-green-50 border-green-100 text-green-700' :
                                                task.status === 'lost' ? 'bg-red-50 border-red-100 text-red-700' :
                                                    'bg-blue-50 border-blue-100 text-blue-700'}
                                    `}>
                                        {task.source_type === 'task' ? (task.status === 'today' ? 'Hôm nay' : task.status === 'done' ? 'Xong' : task.status) : task.status}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 mb-0.5 line-clamp-1">
                                    {task.name}
                                </h4>
                                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {task.customer_name || 'Khách lẻ'}
                                </p>
                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                                    {task.source_type === 'deal' ? (
                                        <Link
                                            href={`/crm/${task.id}`}
                                            className="flex-1 text-center text-xs bg-slate-900 text-white py-1.5 rounded hover:bg-slate-800 transition-colors"
                                        >
                                            Xem Deal
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/telesales/tasks`}
                                            className="flex-1 text-center text-xs bg-purple-600 text-white py-1.5 rounded hover:bg-purple-700 transition-colors"
                                        >
                                            Xem Task
                                        </Link>
                                    )}
                                    <button className="flex-1 text-center text-xs bg-white border border-slate-200 text-slate-600 py-1.5 rounded hover:bg-slate-50 font-medium">
                                        Gọi ngay
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">Không có lịch hẹn nào</p>
                            <p className="text-xs">Chọn ngày khác hoặc tạo deal mới</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
