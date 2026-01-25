"use client";

import { useState } from "react";
import { X, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BotConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    scriptName: string;
    title: string;
}

export default function BotConfigModal({ isOpen, onClose, scriptName, title }: BotConfigModalProps) {
    const [arg, setArg] = useState("");
    const [strategy, setStrategy] = useState<'name' | 'post'>('post'); // Default to Smart Post Scan
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleRun = async () => {
        setIsLoading(true);

        // Determine actual script based on strategy selection
        let finalScriptName = scriptName;
        if (scriptName === 'execute_search_add.js' && strategy === 'post') {
            finalScriptName = 'execute_post_scan.js';
        }

        try {
            const res = await fetch('/api/marketing/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptName: finalScriptName,
                    args: arg
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
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setStrategy('post')}
                                    className={`p-3 border rounded-lg text-sm text-left transition-all ${strategy === 'post' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold block">🕵️ Thông minh (AI)</span>
                                    <span className="text-[10px] opacity-80">Quét bài viết tìm chủ shop (VD: Khai trương, cần nguồn)</span>
                                </button>
                                <button
                                    onClick={() => setStrategy('name')}
                                    className={`p-3 border rounded-lg text-sm text-left transition-all ${strategy === 'name' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold block">👤 Cơ bản (Tên)</span>
                                    <span className="text-[10px] opacity-80">Tìm theo tên nick (VD: Hương Tạp Hóa)</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {strategy === 'post' ? 'Từ khóa bài viết' : 'Tên/Biệt danh muốn tìm'}
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder={strategy === 'post' ? "VD: Khai trương, Tìm nguồn sỉ, Mới mở tiệm..." : "VD: Chủ Spa, Bất động sản..."}
                                value={arg}
                                onChange={(e) => setArg(e.target.value)}
                                autoFocus
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                {strategy === 'post'
                                    ? 'Bot sẽ tìm bài viết chứa từ khóa này, sau đó kết bạn với người đăng.'
                                    : 'Bot sẽ tìm người có tên này trong hồ sơ.'}
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
            default:
                return <p className="text-slate-600">Bot này sẽ chạy với cấu hình mặc định. Bạn có chắc chắn muốn chạy?</p>;
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
                        disabled={isLoading || (scriptName !== 'defense_engine.js' && scriptName !== 'manual_login.js' && !arg)}
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
