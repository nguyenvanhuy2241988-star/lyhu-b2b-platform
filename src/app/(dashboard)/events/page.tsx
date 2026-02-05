'use client';

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Event {
    id: string;
    title: string;
    description: string;
    event_type: string;
    start_time: string;
    end_time: string;
    location: string;
    banner_url: string | null;
    status: string;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data, error } = await supabase
                    .from('hr_events')
                    .select('*')
                    .eq('status', 'published') // View only published by default
                    .order('start_time', { ascending: true });

                if (error) {
                    console.error('Error fetching events:', error);
                } else {
                    setEvents(data || []);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Logic to split Featured vs List
    // Filter out past events for the "Upcoming" view, or keep all?
    // Let's keep upcoming events.
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.end_time) >= now);

    // Sort upcoming by date ascending (closest first)
    upcomingEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const featuredEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
    const otherEvents = upcomingEvents.length > 0 ? upcomingEvents.slice(1) : [];

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Đang tải sự kiện...</div>;
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sự kiện & Văn hóa</h1>
                    <p className="text-slate-500">Xem và tham gia các hoạt động của công ty</p>
                </div>
            </div>

            {/* Featured Event / Banner */}
            {featuredEvent ? (
                <Link href={`/events/${featuredEvent.id}`}>
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl min-h-[300px] flex items-end cursor-pointer group hover:scale-[1.01] transition-transform duration-300">
                        {/* Fallback pattern or image */}
                        <div className="absolute inset-0 bg-black/20 z-0" />
                        {featuredEvent.banner_url && (
                            <img
                                src={featuredEvent.banner_url}
                                alt={featuredEvent.title}
                                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                            />
                        )}

                        <div className="relative p-8 z-10 w-full">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                Sắp diễn ra
                            </div>
                            <h2 className="text-4xl font-bold mb-2">{featuredEvent.title}</h2>
                            <div className="flex items-center gap-6 text-blue-100">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    <span>{format(new Date(featuredEvent.start_time), "dd/MM/yyyy", { locale: vi })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    <span>
                                        {format(new Date(featuredEvent.start_time), "HH:mm")} - {format(new Date(featuredEvent.end_time), "HH:mm")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    <span>{featuredEvent.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <p className="text-slate-500">Hiện chưa có sự kiện nào sắp tới.</p>
                </div>
            )}

            {/* Upcoming Events List */}
            {otherEvents.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherEvents.map((event) => (
                        <Link key={event.id} href={`/events/${event.id}`}>
                            <div className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-slate-200/60 rounded-xl bg-white h-full flex flex-col">
                                <div className="h-48 bg-slate-100 relative">
                                    {event.banner_url ? (
                                        <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400 font-medium text-lg">
                                            {event.title.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 space-y-3 flex-1">
                                    <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                                        <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 uppercase tracking-wide text-[10px]">
                                            {event.event_type}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500">
                                            {format(new Date(event.start_time), "dd/MM/yyyy", { locale: vi })}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {event.title}
                                    </h3>
                                    <div className="flex items-center text-slate-500 text-sm gap-2">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
