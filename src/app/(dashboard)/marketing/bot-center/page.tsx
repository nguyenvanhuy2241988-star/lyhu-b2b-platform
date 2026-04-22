"use client";

import { useState, useEffect } from "react";
import { Search, Users, UserPlus, Shield, Bot, Key, Power, Play, StopCircle, RefreshCw, FolderOpen, History, Plus, Zap, Trash2, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import BotActivityLog from "@/components/marketing/BotActivityLog";
import BotConfigModal from "@/components/marketing/BotConfigModal";
import CampaignBuilderModal from "@/components/marketing/CampaignBuilderModal";
import CampaignRunModal from "@/components/marketing/CampaignRunModal";
import TabContentLibrary from "@/components/marketing/TabContentLibrary";
import { supabase } from "@/lib/supabaseClient";
import { toast } from 'sonner';

export default function BotCenterPage() {
    const [activeTab, setActiveTab] = useState<'commands' | 'profiles' | 'queue' | 'campaigns' | 'contents' | 'competitors'>('commands');
    const [activeScript, setActiveScript] = useState<{ name: string, title: string } | null>(null);

    const tabs = [
        { id: 'commands', label: 'Trạm Lệnh', icon: Zap },
        { id: 'profiles', label: 'Đa Tài Khoản (Profiles)', icon: Users },
        { id: 'queue', label: 'Hàng Đợi & Lịch Sử', icon: History },
        { id: 'campaigns', label: 'Chiến Dịch Liên Hoàn', icon: FolderOpen },
        { id: 'contents', label: 'Kho Nội Dung', icon: FolderOpen },
        { id: 'competitors', label: 'Kho Đối Thủ', icon: Shield },
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
                { activeTab === 'queue' && <TabQueue /> }
                { activeTab === 'campaigns' && <TabCampaigns /> }
                { activeTab === 'contents' && <TabContentLibrary /> }
                { activeTab === 'competitors' && <TabCompetitors onRunScript={(script) => setActiveScript(script)} /> }
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
                        title="Săn Khách Mới"
                        desc="Tìm & Kết bạn theo từ khóa"
                        icon={<Search className="w-5 h-5" />}
                        color="blue"
                        onClick={() => onRunScript({ name: 'execute_search_add.js', title: 'Săn Khách Mới' })}
                    />
                    <CommandCard
                        title="Cướp Khách Đối Thủ"
                        desc="Kết bạn từ tệp Profile mục tiêu"
                        icon={<UserPlus className="w-5 h-5" />}
                        color="orange"
                        onClick={() => onRunScript({ name: 'execute_profile_add.js', title: 'Cướp Khách Đối Thủ' })}
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
                    <CommandCard
                        title="Đăng Bài Cá Nhân"
                        desc="Đăng Text/Ảnh lên Profile"
                        icon={<Users className="w-5 h-5" />}
                        color="indigo"
                        onClick={() => onRunScript({ name: 'auto_post_profile.js', title: 'Đăng Bài Cá Nhân' })}
                    />
                    <CommandCard
                        title="Đăng Bài Hội Nhóm"
                        desc="Mở Group & Đăng bài Bán hàng"
                        icon={<Users className="w-5 h-5" />}
                        color="green"
                        onClick={() => onRunScript({ name: 'auto_post_group.js', title: 'Đăng Bài Hội Nhóm' })}
                    />
                    <CommandCard
                        title="Đi Comment Dạo"
                        desc="Quét Top post Group & Bình luận"
                        icon={<Search className="w-5 h-5" />}
                        color="blue"
                        onClick={() => onRunScript({ name: 'auto_comment_group.js', title: 'Đi Comment Dạo' })}
                    />
                    <CommandCard
                        title="Dọn Dẹp Lời Mời"
                        desc="Hủy lời mời kết bạn đã cũ"
                        icon={<Trash2 className="w-5 h-5" />}
                        color="red"
                        onClick={() => onRunScript({ name: 'auto_cancel_requests.js', title: 'Dọn Dẹp Lời Mời' })}
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
    const [commands, setCommands] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQueue = async () => {
        setIsLoading(true);
        // Fetch commands joining with bot_profiles to get the profile name
        const { data, error } = await supabase
            .from('marketing_bot_commands')
            .select(`
                *,
                bot_profiles (
                    profile_name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(50); // Get latest 50
            
        if (!error && data) {
            setCommands(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleCancel = async (id: string) => {
        const { error } = await supabase.from('marketing_bot_commands').update({ status: 'error' }).eq('id', id);
        if (!error) {
            toast.success("Đã hủy lệnh chờ.");
            fetchQueue();
        }
    };

    const handleRetry = async (cmd: any) => {
        const { error } = await supabase.from('marketing_bot_commands').insert({
            script_name: cmd.script_name,
            args: cmd.args,
            profile_id: cmd.profile_id,
            status: 'pending'
        });
        if (!error) {
            toast.success("Đã đưa lệnh vào cuối hàng đợi.");
            fetchQueue();
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'pending': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-semibold animate-pulse">Đang Chờ...</span>;
            case 'running': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold animate-pulse">Đang Chạy Máy</span>;
            case 'completed': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-semibold">Hoàn Thành</span>;
            case 'error': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-semibold">Lỗi / Hủy bỏ</span>;
            default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-semibold">{status}</span>;
        }
    };

    const formatScript = (script: string) => {
        const map: any = {
            'execute_search_add.js': '🔍 Săn Khách Mới',
            'execute_profile_add.js': '🎯 Cướp Khách Đối Thủ',
            'execute_sniper_add.js': '🚀 Bắn Tỉa Mục Tiêu',
            'execute_radar_check.js': '📡 Trạm Rada Rà Sóng',
            'group_finder.js': '👥 Quét Hội Nhóm',
            'invite_friend_page.js': '📩 Mời Bạn Bè',
            'defense_engine.js': '🛡️ Lá Chắn Ảo',
            'manual_login.js': '🔑 Mở Trình Duyệt',
            'master_commander.js': '🧠 Chỉ Huy Bằng Lời',
            'execute_post_scan.js': '🕵️ Quét Bài Viết',
            'execute_suggestion_scan.js': '🌊 Quét Đề Xuất',
            'execute_rival_scan.js': '🎯 Quét Đối Thủ'
        };
        return map[script] || script;
    };

    return (
        <div className="p-6">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Hàng Đợi Lệnh (Queue) & Lịch sử</h2>
                    <p className="text-sm text-slate-500">Giám sát các thao tác máy tính đang xếp hàng hoặc đã thực hiện.</p>
                </div>
                <button onClick={fetchQueue} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 transition-all">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>
            
            {isLoading ? (
                <div className="text-center py-10 text-slate-500">Đang đồng bộ Hàng đợi từ Máy chủ...</div>
            ) : commands.length === 0 ? (
                <div className="border border-slate-200 rounded-lg bg-slate-50 p-12 text-center">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-700">Hàng đợi đang trống</h3>
                    <p className="text-sm text-slate-500 mt-1">Hệ thống cỗ máy BOT hiện đang rảnh rỗi.</p>
                </div>
            ) : (
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="w-full text-sm text-left bg-white">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-5 py-3 font-medium">Lệnh (Task)</th>
                                <th className="px-5 py-3 font-medium">Tham Số / Mục Tiêu</th>
                                <th className="px-5 py-3 font-medium">Profile (Vân tay)</th>
                                <th className="px-5 py-3 font-medium">Trạng thái</th>
                                <th className="px-5 py-3 font-medium">Thời gian tạo</th>
                                <th className="px-5 py-3 font-medium text-right">Điều khiển</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {commands.map(cmd => (
                                <tr key={cmd.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-4 font-semibold text-slate-800">
                                        {formatScript(cmd.script_name)}
                                    </td>
                                    <td className="px-5 py-4 text-slate-600 max-w-[200px] truncate" title={cmd.args}>
                                        {cmd.args ? `"${cmd.args}"` : <span className="text-slate-400 italic">Mặc định</span>}
                                    </td>
                                    <td className="px-5 py-4">
                                        {cmd.bot_profiles?.profile_name ? (
                                            <span className="font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-md">{cmd.bot_profiles.profile_name}</span>
                                        ) : (
                                            <span className="text-slate-500 italic text-xs">🌍 Mặc định</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        {getStatusBadge(cmd.status)}
                                    </td>
                                    <td className="px-5 py-4 text-slate-500 text-xs">
                                        {new Date(cmd.created_at).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        {cmd.status === 'pending' ? (
                                            <button onClick={() => handleCancel(cmd.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors">
                                                Hủy Lệnh
                                            </button>
                                        ) : (
                                            <button onClick={() => handleRetry(cmd)} className="text-xs font-semibold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors">
                                                🔃 Chạy Lại
                                            </button>
                                        )}
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

function TabCampaigns() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modals
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [isRunOpen, setIsRunOpen] = useState(false);
    
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [selectedCampaignName, setSelectedCampaignName] = useState("");

    const fetchCampaigns = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('bot_campaigns')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (!error && data) {
            setCampaigns(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa chiến dịch "${name}"?`)) return;
        const { error } = await supabase.from('bot_campaigns').delete().eq('id', id);
        if (!error) {
            toast.success("Đã xóa chiến dịch");
            fetchCampaigns();
        } else {
            toast.error("Lỗi xóa: " + error.message);
        }
    };

    const openTriggerModal = (c: any) => {
        setSelectedCampaignId(c.id);
        setSelectedCampaignName(c.name);
        setIsRunOpen(true);
    };

    return (
        <div className="p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Chiến Dịch Liên Hoàn</h2>
                    <p className="text-sm text-slate-500 mt-1">Xây dựng Macro tự động hóa - Đóng gói nhiều bước thành 1 nút Kích Nổ bão táp.</p>
                </div>
                <button onClick={() => setIsBuilderOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20">
                    <Plus className="w-5 h-5" /> Mở Máy Dệt Lệnh
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-slate-500 font-medium">Đang đồng bộ Blueprint từ máy chủ...</div>
            ) : campaigns.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-2xl bg-slate-50 p-16 text-center">
                    <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-700 text-lg">Chưa có Chiến Dịch nào</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">Tạo ra các khuôn đúc chứa sẵn chuỗi chu trình tương tác để rảnh tay thực sự.</p>
                    <button onClick={() => setIsBuilderOpen(true)} className="mt-6 px-6 py-2.5 bg-white border border-slate-200 text-blue-600 font-bold rounded-xl hover:bg-slate-50 shadow-sm transition-all">
                        Tạo Blueprint Đầu Tiên
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {campaigns.map(c => (
                        <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            
                            {/* Run Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white via-white to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 flex gap-2">
                                <button onClick={() => openTriggerModal(c)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
                                    <PlayCircle className="w-5 h-5"/> Kích Nổ Ngay
                                </button>
                                <button onClick={() => handleDelete(c.id, c.name)} className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors">
                                    <Trash2 className="w-5 h-5"/>
                                </button>
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <h3 className="font-bold text-slate-800 text-lg line-clamp-2">{c.name}</h3>
                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100 shrink-0">
                                    {c.tasks?.length || 0} Nhịp
                                </span>
                            </div>
                            
                            <div className="space-y-2 mb-8 relative z-0">
                                {c.tasks?.map((t: any, idx: number) => {
                                    // Map readable name
                                    const map: any = {
                                        'execute_search_add.js': 'Săn Khách Sỉ',
                                        'group_finder.js': 'Quét Hội Nhóm',
                                        'invite_friend_page.js': 'Mời Like Page',
                                        'defense_engine.js': 'Lá Chắn Ảo',
                                        'manual_login.js': 'Đăng Nhập Tay',
                                        'execute_post_scan.js': 'Quét Tương Tác',
                                        'execute_suggestion_scan.js': 'Kết bạn Đề Xuất',
                                        'execute_rival_scan.js': 'Cướp Đối Thủ'
                                    };
                                    return (
                                        <div key={idx} className="flex flex-col border-l-2 border-slate-200 pl-3 py-1 relative">
                                            <div className="absolute w-2 h-2 bg-slate-200 rounded-full -left-1.5 top-2.5 ring-4 ring-white"></div>
                                            <span className="text-sm font-semibold text-slate-700">{idx + 1}. {map[t.script_name] || t.script_name}</span>
                                            {t.args && <span className="text-xs text-slate-400 font-medium truncate italic break-all">Mục tiêu: {t.args}</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals injection */}
            {isBuilderOpen && <CampaignBuilderModal isOpen={isBuilderOpen} onClose={() => setIsBuilderOpen(false)} onSaved={() => fetchCampaigns()} />}
            {isRunOpen && <CampaignRunModal isOpen={isRunOpen} onClose={() => setIsRunOpen(false)} campaignId={selectedCampaignId} campaignName={selectedCampaignName} onTriggered={() => alert("✅ Luồng lệnh đã tràn vào Hàng Đợi thành công! Nhảy sang Tab Hàng Đợi để xem nhé.")} />}
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
        orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200",
        red: "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
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

function TabCompetitors({ onRunScript }: { onRunScript: (s: any) => void }) {
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [notes, setNotes] = useState('');

    const fetchCompetitors = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('marketing_competitors').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            setCompetitors(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCompetitors();
    }, []);

    const handleAdd = async () => {
        if (!name || !url) return toast.error("Vui lòng nhập Tên và Link Facebook Đối Thủ");
        
        const { error } = await supabase.from('marketing_competitors').insert({
            name: name,
            profile_url: url,
            notes: notes || null,
        });

        if (error) {
            toast.error("Lỗi khi thêm: " + error.message);
        } else {
            toast.success("Đã lưu Đối thủ vào Kho!");
            setName('');
            setUrl('');
            setNotes('');
            setIsAdding(false);
            fetchCompetitors();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa Đối thủ này khỏi kho?")) return;
        const { error } = await supabase.from('marketing_competitors').delete().eq('id', id);
        if (!error) {
            toast.success("Đã xóa khỏi Kho lưu trữ!");
            fetchCompetitors();
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Kho Lưu Trữ Đối Thủ</h2>
                    <p className="text-sm text-slate-500">Lưu trữ Link Facebook của các đối thủ lớn để Bot dễ dàng "Cướp Khách" hàng ngày.</p>
                </div>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        Thêm Đối Thủ
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-3">Thêm Mục Tiêu Mới</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên Đối Thủ / Kho Sỉ</label>
                            <input value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="VD: Kho sỉ Túi xách ABC" className="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link Facebook (Profile / Group)</label>
                            <input value={url} onChange={e=>setUrl(e.target.value)} type="text" placeholder="https://www.facebook.com/..." className="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (Tuỳ chọn)</label>
                            <input value={notes} onChange={e=>setNotes(e.target.value)} type="text" placeholder="VD: Chuyên sỉ hàng Quảng Châu..." className="w-full px-3 py-2 border rounded-md" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">Lưu Mục Tiêu</button>
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50">Hủy</button>
                    </div>
                </div>
            )}
            
            {isLoading ? (
                <div className="text-center py-10 text-slate-500">Đang tải Kho vũ khí...</div>
            ) : competitors.length === 0 ? (
                <div className="border border-slate-200 rounded-lg bg-slate-50 p-12 text-center">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-700">Kho Đối Thủ Trống</h3>
                    <p className="text-sm text-slate-500 mt-1">Chưa có mục tiêu nào. Hãy thêm Link Facebook của đối thủ để Bot có thể tự động đi cướp khách.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tên Đối Thủ</th>
                                <th className="px-6 py-3 font-medium">Đường Link Đích</th>
                                <th className="px-6 py-3 font-medium">Ghi Chú</th>
                                <th className="px-6 py-3 font-medium text-right">Chiến Dịch</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {competitors.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                                    <td className="px-6 py-4 text-blue-600 truncate max-w-xs">
                                        <a href={c.profile_url} target="_blank" rel="noreferrer" className="hover:underline">{c.profile_url}</a>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{c.notes}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => onRunScript({ name: 'execute_profile_add.js', title: 'Cướp Khách (Đối thủ)' })} 
                                            className="px-3 py-1.5 bg-orange-100 text-orange-700 font-bold rounded hover:bg-orange-200 transition-colors text-xs"
                                        >
                                            🔫 Cướp Ngay
                                        </button>
                                        <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-600 p-1.5">
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


