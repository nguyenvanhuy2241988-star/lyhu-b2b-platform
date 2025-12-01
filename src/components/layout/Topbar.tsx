"use client";

import { Menu, Bell, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "@/lib/auth";
import { useEffect, useState } from "react";

interface TopbarProps {
    onMenuClick: () => void;
    title?: string;
}

export default function Topbar({ onMenuClick, title = "Dashboard" }: TopbarProps) {
    const [userName, setUserName] = useState<string>("User Name");
    const router = useRouter();

    useEffect(() => {
        const user = getCurrentUser();
        if (user?.name) {
            setUserName(user.name);
        }
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3 sm:gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
                    aria-label="Toggle Menu"
                >
                    <Menu className="w-6 h-6 text-slate-600" />
                </button>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">{title}</h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <button className="p-2 hover:bg-slate-100 rounded-lg relative transition-colors">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full border border-white"></span>
                </button>
                <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-slate-200">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">{userName}</span>

                    <button
                        onClick={handleLogout}
                        className="ml-3 text-xs text-slate-500 hover:text-red-500 underline"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </header>
    );
}
