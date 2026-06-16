"use client";

import { useState } from "react";
import { X, Sparkles, Target, DollarSign, Image as ImageIcon, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

interface AutoCampaignGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AutoCampaignGenerator({ isOpen, onClose, onSuccess }: AutoCampaignGeneratorProps) {
    const { session } = useAuth();
    const [goal, setGoal] = useState("");
    const [budget, setBudget] = useState("");
    const [audience, setAudience] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!goal || !budget || !audience) {
            return toast.error("Vui lòng điền đầy đủ Mục tiêu, Ngân sách và Khách hàng mục tiêu.");
        }

        setIsGenerating(true);
        try {
            const res = await fetch("/api/marketing/generate-campaign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accessToken: session?.access_token,
                    adAccountId: session?.user?.id, // Mock mapping
                    pageId: "112376494782495", // Mock page ID from LYHU
                    goal,
                    budget,
                    audience
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra khi tạo chiến dịch");

            toast.success("✅ Đã tạo thành công Chiến dịch Bản Nháp!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">AI Tự Động Lên Camp</h2>
                            <p className="text-sm text-slate-500">Khai báo mục tiêu, AI tự động bốc ảnh và lên quảng cáo Nháp</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors bg-white">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            Mục Tiêu Chiến Dịch
                        </label>
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="VD: Cần bán lô sỉ 500 áo thun phông rộng mùa hè..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all h-24"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                Ngân Sách / Ngày
                            </label>
                            <input
                                type="text"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="VD: 1.000.000đ"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                                <Users className="w-4 h-4 text-purple-500" />
                                Khách Hàng Mục Tiêu
                            </label>
                            <input
                                type="text"
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                placeholder="VD: Sinh viên bán online, đại lý thời trang..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm text-blue-800">
                        <ImageIcon className="w-5 h-5 shrink-0 text-blue-600" />
                        <p>
                            <strong>Hệ thống tự động:</strong> AI sẽ tự động truy cập Kho Media (bot_contents) của bạn để lấy hình ảnh phù hợp nhất với mục tiêu này, sau đó tự viết 3 mẫu Content và đẩy lên thành 3 Bản Nháp (Draft) trên Facebook.
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors">
                        Hủy
                    </button>
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Đang Sinh Content & Lên Camp...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Bắt đầu Tự Động Lên Camp
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
