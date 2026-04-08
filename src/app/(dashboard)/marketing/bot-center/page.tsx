"use client";

import { useState, useEffect } from "react";
import { Search, Users, UserPlus, Shield, Bot, Key, Power, Play, StopCircle, RefreshCw, FolderOpen, History, Plus, Zap, Trash2 } from 'lucide-react';
import Link from 'next/link';
import BotActivityLog from "@/components/marketing/BotActivityLog";
import BotConfigModal from "@/components/marketing/BotConfigModal";
import { supabase } from "@/lib/supabaseClient";
import { toast } from 'sonner';

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
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [folder, setFolder] = useState('.bot_profile_');
    const [proxy, setProxy] = useState('');

    const fetchProfiles = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('bot_profiles').select('*').order('created_at', { ascending: true });
        if (!error && data) {
            setProfiles(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleAdd = async () => {
        if (!name || !folder) return toast.error("Vui lòng nhập đủ Tên và Thư mục");
        
        const { error } = await supabase.from('bot_profiles').insert({
            profile_name: name,
            folder_name: folder,
            proxy_url: proxy || null,
        });

        if (error) {
            toast.error("Lỗi khi thêm Profile: " + error.message);
        } else {
            toast.success("Đã thêm Profile thành công!");
            setName('');
            setFolder('.bot_profile_');
            setProxy('');
            setIsAdding(false);
            fetchProfiles();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa Profile này? (Thư mục cứng trên máy tính sẽ không bị xóa)")) return;
        const { error } = await supabase.from('bot_profiles').delete().eq('id', id);
        if (error) {
            toast.error("Lỗi khi xóa: " + error.message);
        } else {
            toast.success("Đã xóa Profile!");
            fetchProfiles();
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Quản Lý Đa Tài Khoản (Profiles)</h2>
                    <p className="text-sm text-slate-500">Mỗi Profile là một trình duyệt độc lập với Dấu vân tay chống máy chủ riêng.</p>
                </div>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        Thêm Profile Mới
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-3">Thêm Cấu Hình Mới</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên Gợi Nhớ (Tên Nick)</label>
                            <input value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="VD: Nick mồi 01" className="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Thư mục Local</label>
                            <input value={folder} onChange={e=>setFolder(e.target.value)} type="text" placeholder=".bot_profile_2" className="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cấu hình Proxy (Tùy chọn)</label>
                            <input value={proxy} onChange={e=>setProxy(e.target.value)} type="text" placeholder="http://user:pass@ip:port" className="w-full px-3 py-2 border rounded-md" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">Lưu Profile</button>
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50">Hủy</button>
                    </div>
                </div>
            )}
            
            {isLoading ? (
                <div className="text-center py-10 text-slate-500">Đang tải cấu hình...</div>
            ) : profiles.length === 0 ? (
                <div className="border border-slate-200 rounded-lg bg-slate-50 p-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-700">Chưa có Profile phụ nào</h3>
                    <p className="text-sm text-slate-500 mt-1">Hệ thống đang chạy trên 1 Profile ẩn danh duy nhất.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tên Profile</th>
                                <th className="px-6 py-3 font-medium">Thư Mục Ổ Cứng</th>
                                <th className="px-6 py-3 font-medium">Proxy / IP Ẩn Mạng</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {profiles.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-semibold text-slate-800">{p.profile_name}</td>
                                    <td className="px-6 py-4 font-mono text-slate-500">{p.folder_name}</td>
                                    <td className="px-6 py-4 text-slate-500">{p.proxy_url || <span className="text-slate-300 italic">Mạng Gốc (Không dùng Proxy)</span>}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {p.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
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

