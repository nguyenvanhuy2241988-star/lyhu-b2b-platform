import { Menu, MessageCircle, LogOut, Settings, UserCircle, Bell, ChevronDown } from "lucide-react";
import NotificationBell from "../ui/NotificationBell";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState, useRef } from "react";
import { useChatStore } from "@/lib/chatStore";
import { useToast } from "@/components/ui/toast";

interface TopbarProps {
    onMenuClick: () => void;
    title?: string;
}

export default function Topbar({ onMenuClick, title = "Dashboard" }: TopbarProps) {
    const { user, role, signOut: authSignOut } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const router = useRouter();
    const pathname = usePathname();
    const {
        subscribeToGlobalMessages,
        unsubscribeFromGlobalMessages,
        getTotalUnreadCount,
        fetchConversations
    } = useChatStore();
    const { showToast } = useToast();

    const unreadCount = getTotalUnreadCount();

    const userName = user?.full_name || user?.name || user?.email?.split('@')[0] || "User";
    const userEmail = user?.email || "";
    const userRole = role || "";

    useEffect(() => {
        if (user?.id) {
            // Initial fetch to get unread counts
            fetchConversations(user.id);

            // Subscribe to chat notifications
            subscribeToGlobalMessages(user.id, (msg) => {
                if (pathname === '/chat') return;
                const isMentioned = msg.content.includes(`@${user.email?.split('@')[0]}`) || msg.content.includes(`@${user.name}`);
                showToast(
                    `${isMentioned ? '🔴 Bạn được nhắc đến: ' : 'Tin nhắn mới: '} ${msg.content}`,
                    'info',
                    4000
                );
            });
        }

        return () => {
            unsubscribeFromGlobalMessages();
        }
    }, [user?.id, user?.email, user?.name, subscribeToGlobalMessages, unsubscribeFromGlobalMessages, pathname, showToast, fetchConversations]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await authSignOut();
        } finally {
            router.push("/login");
        }
    };

    return (
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3 sm:gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
                    aria-label="Toggle Menu"
                >
                    <Menu className="w-6 h-6 text-slate-600" />
                </button>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {/* Internal Chat Link with Real Unread Badge */}
                <button
                    onClick={() => router.push('/chat')}
                    className="p-2.5 hover:bg-slate-100 rounded-full transition-all relative group active:scale-95"
                    title="Tin nhắn nội bộ"
                >
                    <MessageCircle className="w-5 h-5 text-slate-500 group-hover:text-primary-600 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`flex items-center gap-2 p-1.5 pl-2 rounded-full transition-all border active:scale-95 ${isProfileOpen ? 'bg-slate-50 border-slate-300 shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold uppercase">{userName.charAt(0)}</span>
                        </div>
                        <div className="hidden sm:flex flex-col items-start gap-0 ml-1 mr-1">
                            <span className="text-sm font-semibold text-slate-800 leading-none">{userName}</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{userRole}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{userEmail}</p>
                            </div>

                            <button
                                onClick={() => { setIsProfileOpen(false); router.push('/profile'); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-3 transition-colors group"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-primary-100/50 transition-colors">
                                    <UserCircle className="w-4 h-4 text-slate-500 group-hover:text-primary-600" />
                                </div>
                                Hồ sơ cá nhân
                            </button>

                            <button
                                onClick={() => { setIsProfileOpen(false); router.push('/settings'); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-3 transition-colors group"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-primary-100/50 transition-colors">
                                    <Settings className="w-4 h-4 text-slate-500 group-hover:text-primary-600" />
                                </div>
                                Cài đặt hệ thống
                            </button>

                            <div className="h-px bg-slate-100 my-1 mx-2"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors group"
                            >
                                <div className="p-1.5 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                                    <LogOut className="w-4 h-4 text-red-600" />
                                </div>
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
