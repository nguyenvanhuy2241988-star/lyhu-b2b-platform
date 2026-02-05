'use client';

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, Clock, List, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { cn } from "@/lib/utils";
import CreateEventModal from "./CreateEventModal";
import { getCurrentUser } from "@/lib/auth";
import EventCalendar from "./EventCalendar";
import { useSearchParams, useRouter } from "next/navigation";

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
    const searchParams = useSearchParams();
    const router = useRouter();
    const viewParam = searchParams.get('view');

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [canCreate, setCanCreate] = useState(false);

    // Derived state from URL or default
    const viewMode = viewParam === 'calendar' ? 'calendar' : 'list';

    // Function to change view via URL
    const setViewMode = (mode: 'list' | 'calendar') => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (mode === 'calendar') {
            newParams.set('view', 'calendar');
        } else {
            newParams.delete('view');
        }
        router.push(`/events?${newParams.toString()}`);
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Check permissions
                const user = await getCurrentUser();
                const isAllowed = user?.role === 'admin' || user?.role === 'recruiter';
                setCanCreate(isAllowed);

                // Build query
                let query = supabase
                    .from('hr_events')
                    .select('*')
                    .order('start_time', { ascending: true });

                // If not admin/hr, only show published
                if (!isAllowed) {
                    query = query.eq('status', 'published');
                }

                const { data, error } = await query;

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
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.end_time) >= now);
    upcomingEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const featuredEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
    const otherEvents = upcomingEvents.length > 0 ? upcomingEvents.slice(1) : [];

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Đang tải sự kiện...</div>;
    }

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        {viewMode === 'list' ? 'Sự kiện sắp tới' : 'Lịch sự kiện'}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex p-0.5 rounded-lg border border-slate-200 bg-slate-50">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'list' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                            title="Danh sách"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'calendar' ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                            title="Lịch"
                        >
                            <Calendar className="w-4 h-4" />
                        </button>
                    </div>

                    {canCreate && (
                        <CreateEventModal onSuccess={() => window.location.reload()} />
                    )}
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="space-y-8 pb-10">
                    {/* Featured Event / Banner */}
                    {featuredEvent ? (
                        <Link href={`/events/${featuredEvent.id}`}>
                            <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-teal-600 to-emerald-600 text-white min-h-[300px] flex items-end cursor-pointer group transition-all duration-300">
                                {/* Fallback pattern or image */}
                                <div className="absolute inset-0 bg-black/20 z-0" />
                                {featuredEvent.banner_url && (
                                    <img
                                        src={featuredEvent.banner_url}
                                        alt={featuredEvent.title}
                                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                                    />
                                )}

                                <div className="relative p-8 z-10 w-full">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4 border border-white/10">
                                        <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            featuredEvent.status === 'draft' ? "bg-yellow-400" : "bg-green-400"
                                        )} />
                                        {featuredEvent.status === 'draft' ? 'Bản nháp' : 'Sắp diễn ra'}
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-2">{featuredEvent.title}</h2>
                                    <div className="flex items-center gap-6 text-teal-50">
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
                        <div className="p-12 text-center border mr-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <p className="text-slate-500">Hiện chưa có sự kiện nào sắp tới.</p>
                            {canCreate && (
                                <p className="text-sm text-teal-600 mt-2 font-medium">Hãy tạo sự kiện đầu tiên!</p>
                            )}
                        </div>
                    )}

                    {/* Upcoming Events List */}
                    {otherEvents.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {otherEvents.map((event) => (
                                <Link key={event.id} href={`/events/${event.id}`}>
                                    <div className="group transition-all duration-300 cursor-pointer overflow-hidden border border-slate-200 rounded-xl bg-white h-full flex flex-col hover:border-teal-400 hover:ring-1 hover:ring-teal-400/20">
                                        <div className="h-48 bg-slate-100 relative">
                                            {event.banner_url ? (
                                                <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 bg-slate-50 flex items-center justify-center text-slate-300 font-medium text-lg">
                                                    {event.title.charAt(0)}
                                                </div>
                                            )}
                                            {event.status === 'draft' && (
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                                                    DRAFT
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 space-y-3 flex-1">
                                            <div className="flex items-center gap-2 text-xs font-medium text-teal-600">
                                                <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100 uppercase tracking-wide text-[10px]">
                                                    {event.event_type}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-slate-500">
                                                    {format(new Date(event.start_time), "dd/MM/yyyy", { locale: vi })}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-lg group-hover:text-teal-700 transition-colors line-clamp-2">
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
            ) : (
                <div className="opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards opacity-100">
                    {/* Render Calendar */}
                    <EventCalendar events={events} />
                </div>
            )
            }
        </div >
    );
}
