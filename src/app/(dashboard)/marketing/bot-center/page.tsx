"use client";

import { useState } from "react";
import { Search, Users, UserPlus, Shield, Bot, Key, Power, Play, StopCircle, RefreshCw, FolderOpen, History, Plus, Zap } from 'lucide-react';
import Link from 'next/link';
import BotActivityLog from "@/components/marketing/BotActivityLog";
import BotConfigModal from "@/components/marketing/BotConfigModal";

export default function BotCenterPage() {
    const [activeTab, setActiveTab] = useState<'commands' | 'profiles' | 'queue' | 'campaigns'>('commands');
    const [activeScript, setActiveScript] = useState<{ name: string, title: string } | null>(null);

    const tabs = [
        { id: 'commands', label: 'Trạm Lệnh', icon: Zap },
        { id: 'profiles', label: 'Đa Tài Khoản (Profiles)', icon: Users },
        { id: 'queue', label: 'Hàng Đợi & Lịch Sử', icon: History },
        { id: 'campaigns', label: 'Chiến Dịch Liên Hoàn', icon: FolderOpen },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Bot className="w-8 h-8 text-blue-600" />
                    Trung Tâm Điều Khiển BOT Tự Động
                </h1>
                <p className="text-slate-500 mt-1">Quản lý kịch bản, hàng đợi và các trình duyệt giả lập ẩn danh.</p>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl w-full max-w-3xl overflow-x-auto">
                {tabs.map((tab) => {
                    // Cần import Zap, tạm dùng Bot
                    const Icon = tab.id === 'commands' ? Power : tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* TAB CONTENT */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
                {activeTab === 'commands' && (
                    <TabCommands 
                        onRunScript={(script) => setActiveScript(script)} 
                    />
                )}
                {activeTab === 'profiles' && <TabProfiles />}
                {activeTab === 'queue' && <TabQueue />}
                {activeTab === 'campaigns' && <TabCampaigns />}
            </div>

            {/* CONFIG MODAL */}
            {activeScript && (
                <BotConfigModal
                    isOpen={!!activeScript}
                    onClose={() => setActiveScript(null)}
                    scriptName={activeScript.name}
                    title={activeScript.title}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------
// TABS COMPONENTS
// ---------------------------------------------------------

function TabCommands({ onRunScript }: { onRunScript: (s: any) => void }) {
    return (
        <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT: CONTROLS */}
            <div className="xl:col-span-2 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Các Lệnh Điều Khiển Có Sẵn</h2>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 font-medium rounded-full">Trạng thái: Máy Chủ Online</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CommandCard
                        title="Săn Khách Hàng"
                        desc="Tìm & Kết bạn theo từ khóa"
                        icon={<Search className="w-5 h-5" />}
                        color="blue"
                        onClick={() => onRunScript({ name: 'execute_search_add.js', title: 'Săn Khách Hàng' })}
                    />
                    <CommandCard
                        title="Quét Hội Nhóm"
                        desc="Tìm & Xin vào nhóm tiềm năng"
                        icon={<Users className="w-5 h-5" />}
                        color="indigo"
                        onClick={() => onRunScript({ name: 'group_finder.js', title: 'Quét Hội Nhóm' })}
                    />
                    <CommandCard
                        title="Mời Bạn Bè"
                        desc="Mời bạn bè Like Page (Traffic)"
                        icon={<UserPlus className="w-5 h-5" />}
                        color="green"
                        onClick={() => onRunScript({ name: 'invite_friend_page.js', title: 'Mời Bạn Bè' })}
                    />
                    <CommandCard
                        title="Lá Chắn Ảo"
                        desc="Giả lập hành vi & Nuôi nick"
                        icon={<Shield className="w-5 h-5" />}
                        color="slate"
                        onClick={() => onRunScript({ name: 'defense_engine.js', title: 'Lá Chắn Ảo' })}
                    />
                    <CommandCard
                        title="Đăng Nhập"
                        desc="Mở trình duyệt để Login tay"
                        icon={<Key className="w-5 h-5" />}
                        color="orange"
                        onClick={() => onRunScript({ name: 'manual_login.js', title: 'Đăng Nhập' })}
                    />
                </div>
            </div>

            {/* RIGHT: LIVE LOGS */}
            <div className="xl:col-span-1 rounded-xl bg-slate-900 overflow-hidden shadow-inner border border-slate-700 min-h-[400px]">
                <BotActivityLog />
            </div>
        </div>
    );
}

function TabProfiles() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Quản Lý Đa Tài Khoản (Profiles)</h2>
                    <p className="text-sm text-slate-500">Mỗi Profile là một trình duyệt độc lập với Dấu vân tay chống máy chủ riêng.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Thêm Profile Mới
                </button>
            </div>
            
            <div className="border border-slate-200 rounded-lg bg-slate-50 p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700">Chưa có Profile phụ nào</h3>
                <p className="text-sm text-slate-500 mt-1">Tất cả các lệnh đang được chạy trên Profile mặc định (.bot_profile)</p>
            </div>
        </div>
    )
}

function TabQueue() {
    return (
        <div className="p-6">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Hàng Đợi Lệnh (Queue)</h2>
                    <p className="text-sm text-slate-500">Danh sách các lệnh đang chờ xử lý từ trung tâm máy chủ.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50">
                    <RefreshCw className="w-4 h-4" />
                    Làm mới
                </button>
            </div>
            <div className="border border-slate-200 rounded-lg bg-slate-50 p-12 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700">Hàng đợi đang trống</h3>
                <p className="text-sm text-slate-500 mt-1">Hệ thống cỗ máy BOT hiện đang rảnh rỗi.</p>
            </div>
        </div>
    )
}

function TabCampaigns() {
    return (
        <div className="p-6">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Kịch Bản Liên Hoàn (Macro)</h2>
                    <p className="text-sm text-slate-500">Xâu chuỗi nhiều lệnh với nhau tạo thành một kịch bản cày tự động hóa hoàn toàn.</p>
                </div>
            </div>
            <div className="border border-slate-200 rounded-lg bg-slate-50 p-12 text-center">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700">Tính năng đang phát triển</h3>
                <p className="text-sm text-slate-500 mt-1">Sắp ra mắt trong phiên bản V3.0</p>
            </div>
        </div>
    )
}

// ---------------------------------------------------------
// UI HELPERS
// ---------------------------------------------------------

function CommandCard({ title, desc, icon, color, onClick }: { title: string, desc: string, icon: React.ReactNode, color: string, onClick: () => void }) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
        indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200",
        green: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200",
        slate: "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200",
        orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200"
    };

    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-start p-4 rounded-xl border transition-all ${colors[color]} hover:-translate-y-1`}
        >
            <div className="flex items-center justify-between w-full mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    {icon}
                </div>
            </div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm opacity-80 text-left">{desc}</p>
        </button>
    );
}

import { toast } from 'sonner';
