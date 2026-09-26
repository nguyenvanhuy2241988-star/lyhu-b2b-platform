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
    const [searchQuery, setSearchQuery] = useState("");
    const { getTotalUnreadCount } = useChatStore();
    const chatUnread = role === 'customer' ? 0 : getTotalUnreadCount();

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

    const filteredHiddenItems = searchQuery.trim()
        ? hiddenItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : hiddenItems;

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

                        {/* Quick Search in Menu */}
                        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                            <input
                                type="text"
                                placeholder="Tìm nhanh tính năng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-primary-500 text-slate-700 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-4 gap-2.5">
                                {filteredHiddenItems.map((item) => {
                                    const Icon = item.icon as LucideIcon;
                                    const isActive = pathname === item.href;
                                    const isChatLink = item.href === '/chat';

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95 text-center group",
                                                isActive ? "bg-primary-50/80 border border-primary-300" : "hover:bg-slate-50 border border-transparent"
                                            )}
                                        >
                                            <div className={cn(
                                                "relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0",
                                                isActive 
                                                    ? "bg-primary-600 text-white shadow-sm" 
                                                    : "bg-slate-50 border border-slate-200 text-primary-600 group-hover:border-primary-300 group-hover:bg-primary-50/50"
                                            )}>
                                                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2px]" : "stroke-[1.75px]")} />
                                                {isChatLink && chatUnread > 0 && (
                                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                                        {chatUnread > 9 ? '9+' : chatUnread}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] line-clamp-2 leading-tight w-full",
                                                isActive ? "font-bold text-primary-700" : "font-medium text-slate-700"
                                            )}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {filteredHiddenItems.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-8">Không tìm thấy tính năng phù hợp</p>
                            )}
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
                    </>
                )}
            </>
        );
    }
