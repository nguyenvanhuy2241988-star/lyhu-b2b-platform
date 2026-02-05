'use client';

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Event {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    event_type: string;
    status: string;
}

interface EventCalendarProps {
    events: Event[];
}

export default function EventCalendar({ events }: EventCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Align start of week (Monday)
    // Simple grid: just list days for now, perfect calendar grid requires checking day of week of start
    const startDayOfWeek = monthStart.getDay(); // 0 is Sunday, 1 is Monday...
    // Adjust to Monday start: 0->6, 1->0, 2->1 ...
    const emptyDaysCount = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const emptyDays = Array.from({ length: emptyDaysCount });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const getEventsForDay = (day: Date) => {
        return events.filter(e => isSameDay(new Date(e.start_time), day));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 capitalize">
                    {format(currentDate, "MMMM yyyy", { locale: vi })}
                </h3>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 text-center border-b border-slate-100 bg-slate-50/50">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="py-2 text-xs font-medium text-slate-500">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[100px]">
                {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="border-b border-r border-slate-50 bg-slate-50/30" />
                ))}

                {daysInMonth.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isTodayDate = isToday(day);

                    return (
                        <div key={day.toString()} className={cn(
                            "border-b border-r border-slate-100 p-2 relative group transition-colors hover:bg-slate-50",
                            isTodayDate && "bg-blue-50/30"
                        )}>
                            <div className="flex justify-between items-start mb-1">
                                <span className={cn(
                                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                    isTodayDate ? "bg-blue-600 text-white" : "text-slate-700"
                                )}>
                                    {format(day, "d")}
                                </span>
                                {dayEvents.length > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                )}
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[60px] no-scrollbar">
                                {dayEvents.map(event => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <div className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate border bg-blue-50 border-blue-100 text-blue-700 hover:border-blue-300 transition-colors cursor-pointer">
                                            {format(new Date(event.start_time), "HH:mm")} {event.title}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
