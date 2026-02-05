'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";
import { Calendar, LayoutDashboard, Heart, ChevronRight, List } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function EventsLayout({ children }: { children: React.ReactNode }) {
    useAuthGuard();
    const { role } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');

    // Theme Color (LYHU Brand)
    const themeColor = "#0d9488"; // teal-600

    const EVENTS_NAV = [
        {
            label: "Tổng quan",
            href: "/events",
            icon: LayoutDashboard,
            isActive: pathname === "/events" && !currentView
        },
        {
            label: "Lịch sự kiện",
            href: "/events?view=calendar",
            icon: Calendar,
            isActive: currentView === 'calendar'
        },
        // { 
        //     label: "Sự kiện của tôi", 
        //     href: "/events?filter=my-events", 
        //     icon: Heart,
        //     isActive: searchParams.get('filter') === 'my-events'
        // }
    ];

    return (
        <DashboardShell role={(role as any) || ROLES.RECRUITER} title="Sự kiện & Văn hóa">
            <div className="flex flex-col lg:flex-row gap-6 p-6 h-full overflow-hidden min-h-[calc(100vh-100px)]">
                {/* Local Sidebar (List Module) */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-6">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3 px-1">Menu</h3>
                        <div className="space-y-1">
                            {EVENTS_NAV.map((item) => {
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${item.isActive
                                            ? "bg-teal-50 text-teal-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-4 h-4 ${item.isActive ? '' : 'text-slate-400'}`} style={item.isActive ? { color: themeColor } : {}} />
                                            {item.label}
                                        </div>
                                        {item.isActive && <ChevronRight className="w-4 h-4" style={{ color: themeColor }} />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Branding / Banner Widget (Optional) */}
                    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                <Heart className="w-4 h-4" /> Kết nối & Sẻ chia
                            </h4>
                            <p className="text-[11px] opacity-90 leading-relaxed">
                                Nơi lưu giữ những khoảnh khắc đáng nhớ của đại gia đình LYHU.
                            </p>
                        </div>
                        {/* Decorative Circles */}
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative w-full">
                    {children}
                </div>
            </div>
        </DashboardShell>
    );
}
