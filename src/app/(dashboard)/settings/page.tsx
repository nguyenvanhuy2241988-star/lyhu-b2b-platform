"use client";

import { useState } from "react";
import { Settings, Bell, Lock, Eye, Globe, Moon, Laptop, Sun, Save, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
    const [theme, setTheme] = useState("system");
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        mentions: true,
        orders: false
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý tùy chọn cá nhân và thiết lập bảo mật của bạn.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 leading-none">
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-blue-600 border border-blue-100 rounded-2xl text-sm font-bold shadow-sm transition-all">
                        <UserCircle className="w-4 h-4" />
                        Tài khoản
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white rounded-2xl text-sm font-medium transition-all">
                        <Bell className="w-4 h-4" />
                        Thông báo
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white rounded-2xl text-sm font-medium transition-all">
                        <Lock className="w-4 h-4" />
                        Bảo mật
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white rounded-2xl text-sm font-medium transition-all">
                        <Globe className="w-4 h-4" />
                        Ngôn ngữ
                    </button>
                </div>

                {/* Main Settings Content */}
                <div className="md:col-span-3 space-y-6">
                    {/* General Settings */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Laptop className="w-5 h-5 text-blue-600" />
                                Giao diện & Trải nghiệm
                            </h3>

                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                        <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">Sáng</span>
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                        <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">Tối</span>
                                </button>
                                <button
                                    onClick={() => setTheme("system")}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'system' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <Laptop className={`w-5 h-5 ${theme === 'system' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">Hệ thống</span>
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-slate-50"></div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Bell className="w-5 h-5 text-blue-600" />
                                Cấu hình thông báo
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Thông báo Email</p>
                                            <p className="text-xs text-slate-400">Nhận cập nhật quan trọng qua hòm thư điện tử.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={notifications.email} onChange={() => setNotifications({ ...notifications, email: !notifications.email })} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-2 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Thông báo đẩy (Push)</p>
                                            <p className="text-xs text-slate-400">Hiển thị thông báo ngay khi có tin nhắn mới.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={notifications.push} onChange={() => setNotifications({ ...notifications, push: !notifications.push })} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-50"></div>

                        <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-4">
                            <div className="p-2 bg-blue-100/50 rounded-lg">
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Cần trợ giúp thêm?</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Nếu bạn gặp bất kỳ vấn đề nào với cài đặt hệ thống, vui lòng liên hệ đội ngũ Kỹ thuật qua mục Chat nội bộ.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { UserCircle, Mail } from "lucide-react";
