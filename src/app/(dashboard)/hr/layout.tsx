"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";
import { Users, Calendar, Gift, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { HRLayoutProvider, useHRLayout } from "@/components/hr/HRLayoutContext";

function HRLayoutContent({ children }: { children: React.ReactNode }) {
    useAuthGuard();
    const { role } = useAuth();
    const pathname = usePathname();
    const { posters, themeColor } = useHRLayout();

    const HR_NAV = [
        { label: "Hồ sơ Nhân sự", href: "/hr/directory", icon: Users },
        { label: "Xếp lịch làm việc", href: "/hr/scheduling", icon: Calendar },
        { label: "Văn hóa & Quỹ", href: "/hr/culture", icon: Gift },
    ];

    const hasPosters = posters.some(p => !!p);
    const [showGuide, setShowGuide] = useState(false);

    return (
        <DashboardShell role={(role as any) || ROLES.RECRUITER} title="Quản trị Nhân sự (HRM)">
            <div className="flex flex-col lg:flex-row gap-6 p-6 h-full overflow-hidden">
                {/* Local Sidebar (Modules) */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-4 max-h-full overflow-y-auto chrome-scrollbar bg-slate-50/50 rounded-xl">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3 px-1">Module HR</h3>
                        <div className="space-y-1">
                            {HR_NAV.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                                            ? "bg-teal-50 text-teal-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                        style={isActive ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-4 h-4 ${isActive ? '' : 'text-slate-400'}`} style={isActive ? { color: themeColor } : {}} />
                                            {item.label}
                                        </div>
                                        {isActive && <ChevronRight className="w-4 h-4" style={{ color: themeColor }} />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Culture & Poster Widget */}
                    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                <Gift className="w-4 h-4" /> Cải tiến Văn hóa?
                            </h4>
                            <p className="text-[11px] opacity-90 mb-3 leading-relaxed">
                                Tổ chức sinh nhật và sự kiện công ty thật dễ dàng.
                            </p>
                            <button
                                onClick={() => setShowGuide(true)}
                                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded font-medium transition w-full text-center"
                            >
                                Xem hướng dẫn
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Poster Area (3 Slots) */}
                    {hasPosters && (
                        <div className="space-y-3">
                            {posters.map((url, idx) => url && (
                                <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <img
                                        src={url}
                                        alt={`Poster ${idx + 1}`}
                                        className="w-full h-auto object-contain max-h-[400px]"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {children}
                </div>
            </div>

            {/* Guide Modal */}
            {showGuide && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowGuide(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-bold text-teal-700 mb-4 flex items-center gap-2">
                            <Gift className="w-5 h-5" />
                            Góc Văn hóa LYHU
                        </h3>
                        <div className="space-y-4 text-sm text-slate-600">
                            <p>Chào mừng bạn đến với module Văn hóa & Quỹ của LYHU!</p>

                            <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                                <h4 className="font-semibold text-teal-800 mb-1">🎉 Tổ chức Sinh nhật</h4>
                                <p>Hệ thống tự động nhắc nhở sinh nhật của các thành viên trong tháng. Hãy chuẩn bị những lời chúc ý nghĩa nhé!</p>
                            </div>

                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <h4 className="font-semibold text-emerald-800 mb-1">💰 Quỹ Công ty</h4>
                                <p>Theo dõi thu/chi minh bạch. Mọi khoản chi cho ăn uống, party đều được ghi nhận tại đây.</p>
                            </div>

                            <p className="italic text-xs text-slate-400">
                                Mọi đóng góp ý kiến để cải thiện văn hóa công ty vui lòng liên hệ bộ phận HR.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowGuide(false)}
                            className="w-full mt-6 bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition"
                        >
                            Đã hiểu
                        </button>
                    </div>
                </div>
            )}
        </DashboardShell>
    );
}

export default function HRLayout({ children }: { children: React.ReactNode }) {
    return (
        <HRLayoutProvider>
            <HRLayoutContent>{children}</HRLayoutContent>
        </HRLayoutProvider>
    );
}
