"use client";

import { useState, useEffect } from "react";
import { X, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface CampaignRunModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string | null;
    campaignName: string;
    onTriggered: () => void;
}

export default function CampaignRunModal({ isOpen, onClose, campaignId, campaignName, onTriggered }: CampaignRunModalProps) {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState("");
    const [isTriggering, setIsTriggering] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProfiles();
        }
    }, [isOpen]);

    const fetchProfiles = async () => {
        const { data, error } = await supabase.from('bot_profiles').select('*').order('created_at', { ascending: false });
        if (data) setProfiles(data);
    };

    if (!isOpen) return null;

    const handleRun = async () => {
        if (!selectedProfileId) {
            return toast.error("Vui lòng chọn Profile (Vân tay) đích để thả Bot");
        }

        setIsTriggering(true);

        try {
            const res = await fetch('/api/marketing/campaign/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId,
                    profileId: selectedProfileId === 'default' ? null : selectedProfileId
                })
            });

            const raw = await res.json();
            if (res.ok) {
                toast.success(raw.message || "Bơm chuỗi lệnh thành công!");
                onTriggered();
                onClose();
            } else {
                toast.error(raw.error || "Gặp lỗi khi bơm hàng đợi");
            }
        } catch (e: any) {
            toast.error("Lỗi mất kết nối máy chủ");
        }
        
        setIsTriggering(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white relative">
                    <button onClick={onClose} className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                        <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Kích Nổ Chiến Dịch</h3>
                    <p className="text-blue-100 text-sm truncate">{campaignName}</p>
                </div>

                <div className="p-6 bg-slate-50">
                    <p className="text-sm text-slate-600 mb-4 font-medium">
                        Bot cần mượn một nhân dạng (Profile / Vân tay mạng) để thực thi toàn bộ chuỗi lệnh này. Vui lòng cấp quyền:
                    </p>
                    
                    <select 
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                        className="w-full text-slate-800 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none mb-6 font-semibold"
                    >
                        <option value="" disabled>-- Chọn Nhân dạng để Thả Bot --</option>
                        <option value="default">🌐 Profile Ẩn danh Mặc định (Tạm thời)</option>
                        {profiles.map(p => (
                            <option key={p.id} value={p.id}>👤 {p.profile_name} ({p.folder_name})</option>
                        ))}
                    </select>

                    <button
                        onClick={handleRun}
                        disabled={isTriggering || !selectedProfileId}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
                    >
                        {isTriggering ? (
                            "Đang bơm vào Hàng đợi..."
                        ) : (
                            <>Phóng Lệnh <PlayCircle className="w-5 h-5" /></>
                        )}
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-3 text-slate-500 font-medium hover:text-slate-700 mt-2"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
}
