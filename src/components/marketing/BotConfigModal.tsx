"use client";

import { useState, useEffect } from "react";
import { X, Play, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface BotConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    scriptName: string;
    title: string;
}

export default function BotConfigModal({ isOpen, onClose, scriptName, title }: BotConfigModalProps) {
    const [arg, setArg] = useState("");
    const [strategy, setStrategy] = useState<'name' | 'post' | 'commander' | 'suggestion' | 'rival'>('commander'); // Default to NLP Commander
    const [isLoading, setIsLoading] = useState(false);
    
    // Multi-profile Support
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>("");

    useEffect(() => {
        if (!isOpen) return;
        const fetchProfiles = async () => {
            const { data, error } = await supabase.from('bot_profiles').select('*').order('created_at', { ascending: true });
            if (!error && data) {
                setProfiles(data);
            }
        };
        fetchProfiles();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleRun = async () => {
        setIsLoading(true);

        // Determine actual script based on strategy selection
        let finalScriptName = scriptName;
        if (scriptName === 'execute_search_add.js') {
            if (strategy === 'post') finalScriptName = 'execute_post_scan.js';
            if (strategy === 'commander') finalScriptName = 'master_commander.js';
            if (strategy === 'suggestion') finalScriptName = 'execute_suggestion_scan.js';
            if (strategy === 'rival') finalScriptName = 'execute_rival_scan.js';
        }

        try {
            const res = await fetch('/api/marketing/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptName: finalScriptName,
                    args: arg,
                    profileId: selectedProfileId || null // Pass selected profile to API
                })
            });

            if (res.ok) {
                toast.success(`Đã gửi lệnh cho Bot: ${title}`);
                onClose();
            } else {
                toast.error("Lỗi khởi động Bot");
            }
        } catch (e) {
            toast.error("Lỗi kết nối Server");
        } finally {
            setIsLoading(false);
        }
    };

    // Determine Input Type based on Script
    const getConfigUI = () => {
        switch (scriptName) {
            case 'execute_search_add.js':
                return (
                    <div className="space-y-4">
                        {/* Strategy Selector */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Chiến thuật Săn</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setStrategy('commander')}
                                    className={`p-2 border rounded-lg text-sm text-left transition-all ${strategy === 'commander' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold block">🧠 Tự động</span>
                                    <span className="text-[10px] opacity-80">Hiểu lệnh nói</span>
                                </button>
                                <button
                                    onClick={() => setStrategy('post')}
                                    className={`p-2 border rounded-lg text-sm text-left transition-all ${strategy === 'post' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold block">🕵️ Bài viết</span>
                                    <span className="text-[10px] opacity-80">Quét từ khóa</span>
                                </button>
                                <button
                                    onClick={() => setStrategy('suggestion')}
                                    className={`p-2 border rounded-lg text-sm text-left transition-all ${strategy === 'suggestion' ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold block">🌊 Gợi ý</span>
                                    <span className="text-[10px] opacity-80">Fb đề xuất</span>
                                </button>
                                <button
                                    onClick={() => setStrategy('rival')}
                                    className={`p-2 border rounded-lg text-sm text-left transition-all ${strategy === 'rival' ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold block">🎯 Đối thủ</span>
                                    <span className="text-[10px] opacity-80">Cướp comment</span>
                                </button>
                                <button
                                    onClick={() => setStrategy('name')}
                                    className={`p-2 border rounded-lg text-sm text-left transition-all ${strategy === 'name' ? 'border-slate-500 bg-slate-50 text-slate-700 ring-1 ring-slate-500' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold block">👤 Cơ bản</span>
                                    <span className="text-[10px] opacity-80">Theo tên</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            {strategy !== 'suggestion' && (
                                <>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {strategy === 'commander' && 'Ra lệnh cho Bot (Giọng nói/Văn bản)'}
                                        {strategy === 'post' && 'Từ khóa bài viết (Khai trương...)'}
                                        {strategy === 'rival' && 'Link Fanpage Đối thủ'}
                                        {strategy === 'name' && 'Tên/Biệt danh muốn tìm'}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder={
                                            strategy === 'commander' ? "VD: Tìm chủ tạp hóa ở Cầu Giấy..." :
                                                strategy === 'post' ? "VD: Khai trương, Tìm nguồn sỉ..." :
                                                    strategy === 'rival' ? "https://facebook.com/DoiThuCuaBan" :
                                                        "VD: Chủ Spa..."
                                        }
                                        value={arg}
                                        onChange={(e) => setArg(e.target.value)}
                                        autoFocus
                                    />
                                </>
                            )}

                            <p className="text-xs text-slate-500 mt-1">
                                {strategy === 'commander' && 'Bot sẽ tự phân tích câu lệnh để chọn cách tìm kiếm tốt nhất.'}
                                {strategy === 'suggestion' && 'Bot sẽ tự động kết bạn với những người trong danh sách "Gợi ý" của Facebook (Độ chính xác cao do thuật toán FB).'}
                                {strategy === 'rival' && 'Bot sẽ vào Page đối thủ, tìm những người comment mua hàng để kết bạn.'}
                            </p>
                        </div>
                    </div>
                );
            case 'group_finder.js':
                return (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Chủ đề Hội Nhóm</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="VD: Chợ sỉ quần áo, Tìm việc làm..."
                            value={arg}
                            onChange={(e) => setArg(e.target.value)}
                            autoFocus
                        />
                        <p className="text-xs text-slate-500 mt-1">Bot sẽ tìm và lọc nhóm có tương tác tốt.</p>
                    </div>
                );
            case 'invite_friend_page.js':
                return (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng mời tối đa</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="VD: 50"
                            value={arg}
                            onChange={(e) => setArg(e.target.value)}
                            autoFocus
                        />
                        <p className="text-xs text-slate-500 mt-1">Nên để dưới 50 người/lần để tránh Checkpoint.</p>
                    </div>
                );
            case 'auto_post_profile.js':
            case 'auto_post_group.js':
            case 'auto_comment_group.js':
                return (
                    <div className="space-y-3">
                        {scriptName === 'auto_post_group.js' || scriptName === 'auto_comment_group.js' ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn FB Group (Tùy chọn)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Bỏ trống để tự chọn Group ngẫu nhiên"
                                    value={arg}
                                    onChange={(e) => setArg(e.target.value)}
                                />
                            </div>
                        ) : null}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên Kho Nội Dung (Category)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="VD: Kho Bán Hàng Máy Tính (Bỏ trống = Mặc định)"
                                value={scriptName === 'auto_post_group.js' || scriptName === 'auto_comment_group.js' ? arg.split('|')[1]?.trim() || '' : arg}
                                onChange={(e) => {
                                    if (scriptName === 'auto_post_group.js' || scriptName === 'auto_comment_group.js') {
                                        const groupUrl = arg.split('|')[0]?.trim() || '';
                                        setArg(groupUrl ? `${groupUrl} | ${e.target.value}` : e.target.value);
                                    } else {
                                        setArg(e.target.value);
                                    }
                                }}
                            />
                        </div>
                        <p className="text-xs text-slate-500">Mẹo: Cần tạo sẵn mồi trong Tab 5: Kho Nội Dung.</p>
                    </div>
                );
            default:
                return <p className="text-slate-600">Bot này sẽ chạy với tham số mặc định. Vui lòng chọn Profile thực thi ở bên dưới.</p>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Cấu hình: {title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {getConfigUI()}

                    {/* Profile Selector */}
                    <div className="mt-6 border-t pt-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <Users className="w-4 h-4 text-blue-600"/>
                            Chọn Tài khoản (Profile)
                        </label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedProfileId}
                            onChange={(e) => setSelectedProfileId(e.target.value)}
                        >
                            <option value="">-- Profile Ẩn danh Mặc định --</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.profile_name} ({p.folder_name})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={isLoading || (scriptName === 'execute_search_add.js' && !arg) || (scriptName === 'group_finder.js' && !arg) || (scriptName === 'invite_friend_page.js' && !arg)}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Chạy Ngay
                    </button>
                </div>
            </div>
        </div>
    );
}
