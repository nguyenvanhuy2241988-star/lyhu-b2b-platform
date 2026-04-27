"use client";

import { useState, useEffect } from "react";
import { Bell, Lock, Globe, Moon, Laptop, Sun, Save, ShieldCheck, UserCircle, Mail } from "lucide-react";

export default function SettingsPage() {
    const [theme, setTheme] = useState("system");
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        mentions: true,
        orders: false
    });

    useEffect(() => {
        // Load theme on mount
        const savedTheme = localStorage.getItem('theme') || 'system';
        setTheme(savedTheme);
    }, []);

    const applyTheme = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        const root = document.documentElement;
        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else if (newTheme === 'light') {
            root.classList.remove('dark');
        } else {
            // System
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-950 p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-8 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Cài đặt hệ thống</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý tùy chọn cá nhân và thiết lập bảo mật của bạn.</p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-600 text-white rounded-xl font-medium text-sm shadow-sm transition-all active:scale-95">
                        <Save className="w-4 h-4" />
                        Lưu thay đổi
                    </button>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Minimalist Sidebar Navigation */}
                <div className="md:col-span-1 space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-semibold transition-colors">
                        <UserCircle className="w-4 h-4" />
                        Tài khoản
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors">
                        <Bell className="w-4 h-4" />
                        Thông báo
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors">
                        <Lock className="w-4 h-4" />
                        Bảo mật
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors">
                        <Globe className="w-4 h-4" />
                        Ngôn ngữ
                    </button>
                </div>

                {/* Main Settings Content */}
                <div className="md:col-span-3 space-y-8">
                    {/* Theme Settings */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Giao diện & Trải nghiệm</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tùy chỉnh màu sắc hiển thị phù hợp với mắt bạn.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => applyTheme("light")}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'border-primary ring-1 ring-primary bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    <Sun className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-medium ${theme === 'light' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>Sáng</span>
                            </button>

                            <button
                                onClick={() => applyTheme("dark")}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-primary ring-1 ring-primary bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    <Moon className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>Tối</span>
                            </button>

                            <button
                                onClick={() => applyTheme("system")}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${theme === 'system' ? 'border-primary ring-1 ring-primary bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'system' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    <Laptop className="w-5 h-5" />
                                </div>
                                <span className={`text-sm font-medium ${theme === 'system' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>Hệ thống</span>
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                    {/* Notification Settings */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Cấu hình thông báo</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Chọn loại thông báo bạn muốn nhận.</p>
                        </div>

                        <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                            {/* Email Toggle */}
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Thông báo Email</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nhận cập nhật quan trọng qua hòm thư.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={notifications.email} onChange={() => setNotifications({ ...notifications, email: !notifications.email })} />
                                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Push Toggle */}
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Thông báo đẩy (Push)</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hiển thị popup khi có tin nhắn mới.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={notifications.push} onChange={() => setNotifications({ ...notifications, push: !notifications.push })} />
                                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Support Block */}
                    <div className="bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-xl p-4 flex items-start gap-3 mt-4">
                        <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100">Cần trợ giúp thêm?</h4>
                            <p className="text-xs text-primary-700/80 dark:text-primary-300/80 mt-1 leading-relaxed">Nếu bạn gặp bất kỳ vấn đề nào với cài đặt, vui lòng liên hệ đội ngũ Kỹ thuật (Huy Admin) qua mục Tin nhắn nội bộ.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
