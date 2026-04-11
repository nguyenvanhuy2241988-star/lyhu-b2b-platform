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
    
    // Auto-Group Settings
    const [useCrmGroups, setUseCrmGroups] = useState(false);

    // Multi-profile Support
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>("");
    
    // Content Library Integration
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            const [profilesRes, contentsRes] = await Promise.all([
                supabase.from('bot_profiles').select('*').order('created_at', { ascending: true }),
                supabase.from('bot_contents').select('category')
            ]);
            
            if (!profilesRes.error && profilesRes.data) {
                setProfiles(profilesRes.data);
            }
            if (!contentsRes.error && contentsRes.data) {
                const uniqueCategories = Array.from(new Set(contentsRes.data.map((c: any) => c.category)));
                setCategories(uniqueCategories as string[]);
            }
        };
        fetchData();
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

        let finalArg = arg;

        // Auto fetch CRM Groups if enabled
        if (useCrmGroups && ['auto_post_group.js', 'auto_comment_group.js', 'group_finder.js'].includes(scriptName)) {
            const { data, error } = await supabase.from('telesales_fb_groups').select('link').eq('status', 'active');
            if (!error && data && data.length > 0) {
                const linksArray = data.map((g: any) => g.link).filter(Boolean);
                if (linksArray.length === 0) {
                    toast.error("CRM chưa có Nhóm nào chứa Link hợp lệ để gửi Bot.");
                    setIsLoading(false);
                    return;
                }
                const parts = arg.split("|");
                // Get the quantity the user requested
                const qtyVal = parseInt(parts[2]?.trim()) || (scriptName === 'group_finder.js' ? 5 : 40);
                
                // Only take the exact number of groups requested to avoid crashing the local OS process (E2BIG argument list too long)
                // and to randomize we can shuffle, but for now just slice. We should shuffle to randomize!
                const shuffled = linksArray.sort(() => 0.5 - Math.random());
                const limitedLinks = shuffled.slice(0, qtyVal);
                
                parts[0] = limitedLinks.join(',');
                finalArg = parts.join(" | ");
            } else {
                toast.error("Không tìm thấy Nhóm FB Đang hoạt động nào trong CRM.");
                setIsLoading(false);
                return;
            }
        }

        try {
            const res = await fetch('/api/marketing/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptName: finalScriptName,
                    args: finalArg,
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
                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useCrmGroups}
                                    onChange={(e) => setUseCrmGroups(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                Thiết lập mục tiêu từ CRM (Tham gia các Nhóm trong kho CRM)
                            </label>
                        </div>
                        {!useCrmGroups && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Chủ đề Hội Nhóm để tìm kiếm mới</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="VD: Chợ sỉ quần áo, Tìm việc làm..."
                                    value={arg}
                                    onChange={(e) => setArg(e.target.value)}
                                    autoFocus
                                />
                                <p className="text-xs text-slate-500 mt-1">Bot sẽ tìm kiếm trên Facebook theo từ khóa này và tự động xin vào nhóm.</p>
                            </div>
                        )}
                        {useCrmGroups && (
                            <div className="space-y-4">
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl relative">
                                    <p className="text-[12px] text-amber-800 leading-relaxed">
                                        <strong>Chế độ rải Link CRM:</strong> Hệ thống sẽ tự động quét toàn bộ Nhóm trong kho "Quản lý FB CRM" đã gán và lần lượt cho tài khoản bấm Tham gia.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t pt-3 mt-2 border-slate-100">
                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-1">Số lượng Nhóm / Lần</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50"
                                            placeholder="VD: 5"
                                            value={arg.split('|')[2]?.trim() || '5'}
                                            onChange={(e) => {
                                                const parts = arg.split("|");
                                                setArg(`${parts[0] || ' '} | ${parts[1] || ' '} | ${e.target.value} | ${parts[3]?.trim() || '180'}`);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-1">Khoảng cách/Delay (Giây)</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50"
                                            placeholder="VD: 180"
                                            value={arg.split('|')[3]?.trim() || '180'}
                                            onChange={(e) => {
                                                const parts = arg.split("|");
                                                setArg(`${parts[0] || ' '} | ${parts[1] || ' '} | ${parts[2]?.trim() || '5'} | ${e.target.value}`);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-2 relative">
                                        <p className="text-[11px] text-amber-800 bg-amber-100 p-2 rounded-lg leading-tight mt-1">
                                            <strong>Mẹo chống Checkpoint:</strong> Mỗi ngày chỉ nên xin tham gia <strong>5-10 nhóm</strong>. Khoảng cách an toàn nhất là <strong>180 giây</strong> (Nghỉ 3 phút/nhóm). Mọi hành động diễn ra từ từ như người thật.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
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
                    <div className="space-y-4">
                        {scriptName === 'auto_post_group.js' || scriptName === 'auto_comment_group.js' ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={useCrmGroups}
                                            onChange={(e) => setUseCrmGroups(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        Tự động lấy Nhóm từ CRM (Module Quản lý Nhóm FB)
                                    </label>
                                </div>
                                {!useCrmGroups && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn FB Group (Tùy chọn)</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Bỏ trống để tự động rải vào tất cả Group đã tham gia"
                                            value={arg.split('|')[0]?.trim() || ''}
                                            onChange={(e) => {
                                                const parts = arg.split("|");
                                                parts[0] = e.target.value;
                                                setArg(parts.join(" | "));
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : null}
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên Kho Nội Dung (Category)</label>
                            <input
                                type="text"
                                list="modal-category-suggestions"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Gõ tên hoặc chọn Kho có sẵn (Bỏ trống = Mặc định)"
                                value={scriptName === 'auto_post_group.js' || scriptName === 'auto_comment_group.js' ? arg.split('|')[1]?.trim() || '' : arg}
                                onChange={(e) => {
                                    if (scriptName === 'auto_post_group.js' || scriptName === 'auto_comment_group.js') {
                                        const groupUrl = arg.split('|')[0]?.trim() || '';
                                        const qty = arg.split('|')[2] || '40';
                                        const delay = arg.split('|')[3] || '360';
                                        setArg(`${groupUrl} | ${e.target.value} | ${qty} | ${delay}`);
                                    } else {
                                        setArg(e.target.value);
                                    }
                                }}
                            />
                            <datalist id="modal-category-suggestions">
                                {categories.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                                <option value="Mặc định" />
                            </datalist>
                        </div>

                        {(scriptName === 'auto_post_group.js' || scriptName === 'auto_comment_group.js') && (
                        <div className="grid grid-cols-2 gap-4 border-t pt-3 mt-2 border-slate-100">
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-1">Số lượng Nhóm / Lần</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50"
                                    placeholder="VD: 40"
                                    value={arg.split('|')[2]?.trim() || '40'}
                                    onChange={(e) => {
                                        const parts = arg.split("|");
                                        setArg(`${parts[0] || ' '} | ${parts[1]?.trim() || ' '} | ${e.target.value} | ${parts[3]?.trim() || '360'}`);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-1">Khoảng cách/Delay (Giây)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50"
                                    placeholder="VD: 360"
                                    value={arg.split('|')[3]?.trim() || '360'}
                                    onChange={(e) => {
                                        const parts = arg.split("|");
                                        setArg(`${parts[0] || ' '} | ${parts[1]?.trim() || ' '} | ${parts[2]?.trim() || '40'} | ${e.target.value}`);
                                    }}
                                />
                            </div>
                            <div className="col-span-2 relative">
                                <p className="text-[11px] text-amber-800 bg-amber-100 p-2 rounded-lg leading-tight mt-1">
                                    <strong>Mẹo chống Spam:</strong> Rải 40 nhóm trong 4 tiếng (240 phút) ➡ Khoảng cách tốt nhất là <span className="font-mono bg-white px-1">240 / 40 * 60 = 360 giây</span> (Nghỉ 6 phút/1 bài)
                                </p>
                            </div>
                        </div>
                        )}
                        <p className="text-xs text-slate-500">Mẹo: Cần tạo sẵn mồi trong Tab Kho Nội Dung.</p>
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
                        disabled={isLoading || (scriptName === 'execute_search_add.js' && !arg) || (scriptName === 'group_finder.js' && !useCrmGroups && !arg) || (scriptName === 'invite_friend_page.js' && !arg)}
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
