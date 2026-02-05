'use client';

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, Clock } from "lucide-react";

export default function EventsPage() {
    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sự kiện & Văn hóa</h1>
                    <p className="text-slate-500">Xem và tham gia các hoạt động của công ty</p>
                </div>
            </div>

            {/* Featured Event / Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl min-h-[300px] flex items-end">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative p-8 z-10 w-full">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Sắp diễn ra
                    </div>
                    <h2 className="text-4xl font-bold mb-2">Tiệc Sinh Nhật Công Ty - Kỷ niệm 5 năm</h2>
                    <div className="flex items-center gap-6 text-blue-100">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            <span>15/02/2026</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>18:00 - 21:00</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            <span>Sảnh White Palace</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Events List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-slate-200/60">
                        <div className="h-48 bg-slate-100 relative">
                            {/* Placeholder for event image */}
                            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400">
                                Sự kiện #{i}
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                                <span className="px-2 py-0.5 rounded-full bg-blue-50">Team Building</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500">20/02/2026</span>
                            </div>
                            <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                                Dã ngoại Mùa Xuân 2026
                            </h3>
                            <div className="flex items-center text-slate-500 text-sm gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>Khu du lịch Văn Thánh</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
