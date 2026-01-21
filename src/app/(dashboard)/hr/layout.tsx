"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";
import { Users, Calendar, Gift, ChevronRight } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

export default function HRLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // HR is accessible by all authenticated users now (for Scheduling/Culture)
    // Specific pages like Directory will need their own guards if restricted.
    useAuthGuard(); // Standard check for login
    const { role } = useAuth();
    const pathname = usePathname();

    const HR_NAV = [
        { label: "Hồ sơ Nhân sự", href: "/hr/directory", icon: Users },
        { label: "Xếp lịch làm việc", href: "/hr/scheduling", icon: Calendar },
        { label: "Văn hóa & Quỹ", href: "/hr/culture", icon: Gift },
    ];

    return (
        <DashboardShell role={(role as any) || ROLES.RECRUITER} title="Quản trị Nhân sự (HRM)">
            <div className="flex flex-col lg:flex-row gap-6 p-6 h-full overflow-hidden">
                {/* Local Sidebar (Modules) */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Module HR</h3>
                        <div className="space-y-1">
                            {HR_NAV.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                            {item.label}
                                        </div>
                                        {isActive && <ChevronRight className="w-4 h-4 text-blue-500" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Stats or Promo Widget */}
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                        <h4 className="font-bold text-sm mb-1">Cải tiến Văn hóa?</h4>
                        <p className="text-xs opacity-90 mb-3">Tổ chức sinh nhật và sự kiện công ty thật dễ dàng.</p>
                        <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded font-medium transition">
                            Xem hướng dẫn
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {children}
                </div>
            </div>
        </DashboardShell>
    );
}
