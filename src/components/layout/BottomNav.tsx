"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { LucideIcon, Menu, X, LogOut, Settings as SettingsIcon } from "lucide-react";
import { UserRole } from "@/lib/auth";
import { useEffect, useState } from "react";
import { loadNavOrder, applyNavOrder } from "@/lib/navOrderStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { useChatStore } from "@/lib/chatStore";

interface BottomNavProps {
    role: UserRole;
}

export default function BottomNav({ role }: BottomNavProps) {
    const pathname = usePathname();
    const defaultItems = NAV_ITEMS[role] || [];
    const { user, signOut: authSignOut } = useAuth();
    const [orderedItems, setOrderedItems] = useState(defaultItems);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { getTotalUnreadCount } = useChatStore();
    const chatUnread = getTotalUnreadCount();

    // Load saved order
    useEffect(() => {
        if (!user?.id || !role) return;
        (async () => {
            const saved = await loadNavOrder(user.id, role);
            const ordered = applyNavOrder(defaultItems, saved);
            setOrderedItems(ordered);
        })();
    }, [user?.id, role, defaultItems]);

    // Filter out separators for bottom nav calculation
    const validItems = orderedItems.filter(item => !item.label.startsWith("---"));
    
    // Bottom Nav takes max 4 items. If there are exactly 5, maybe show 5. But usually 4 + 1 "More" is safe.
    const MAX_VISIBLE = 4;
    const visibleItems = validItems.slice(0, MAX_VISIBLE);
    const hiddenItems = validItems.slice(MAX_VISIBLE);

    const handleLogout = async () => {
        try {
            await authSignOut();
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-slate-200 lg:hidden pb-safe">
                <div className="flex items-center justify-around px-2 h-[60px]">
                    {visibleItems.map((item) => {
                        const Icon = item.icon as LucideIcon;
                        const isActive = pathname === item.href;
                        const isChatLink = item.href === '/chat';

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                                    isActive ? "text-primary-600" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <div className="relative flex flex-col items-center gap-1">
                                    <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                                    {isChatLink && chatUnread > 0 && (
                                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                            {chatUnread > 9 ? '9+' : chatUnread}
                                        </span>
                                    )}
                                </div>
                                <span className={cn("text-[10px] truncate w-full text-center px-1", isActive ? "font-semibold" : "font-medium")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {hiddenItems.length > 0 && (
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isMenuOpen ? "text-primary-600" : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <Menu className={cn("w-5 h-5", isMenuOpen && "stroke-[2.5px]")} />
                            <span className={cn("text-[10px]", isMenuOpen ? "font-semibold" : "font-medium")}>Thêm</span>
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile Menu Sheet */}
            {isMenuOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity" 
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="fixed bottom-[60px] left-0 w-full bg-white z-40 lg:hidden rounded-t-2xl shadow-xl border-t border-slate-200 flex flex-col max-h-[75vh] animate-in slide-in-from-bottom-8 duration-200">
                        
                        <div className="px-5 py-4 shrink-0 flex justify-between items-center border-b border-slate-100">
                            <h3 className="font-semibold text-base text-slate-800">Menu chức năng</h3>
                            <button onClick={() => setIsMenuOpen(false)} className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="flex flex-col">
                                {hiddenItems.map((item) => {
                                    const Icon = item.icon as LucideIcon;
                                    const isActive = pathname === item.href;
                                    const isChatLink = item.href === '/chat';

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className={cn(
                                                "relative w-8 h-8 rounded-lg flex items-center justify-center",
                                                isActive ? "bg-primary-50 text-primary-600" : "bg-slate-100 text-slate-500"
                                            )}>
                                                <Icon className={cn("w-4 h-4", isActive && "stroke-[2.5px]")} />
                                                {isChatLink && chatUnread > 0 && (
                                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                                        {chatUnread > 9 ? '9+' : chatUnread}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-sm",
                                                isActive ? "font-semibold text-primary-700" : "font-medium text-slate-700"
                                            )}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="border-t border-slate-100 bg-slate-50 p-4 pb-safe">
                                        <Link 
                                            href="/settings"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-200/50 rounded-lg text-slate-700 transition-colors"
                                        >
                                            <SettingsIcon className="w-4 h-4 text-slate-500" />
                                            <span className="font-medium text-sm">Cài đặt hệ thống</span>
                                        </Link>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors mt-1"
                                        >
                                            <LogOut className="w-4 h-4 text-red-500" />
                                            <span className="font-medium text-sm">Đăng xuất</span>
                                        </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
