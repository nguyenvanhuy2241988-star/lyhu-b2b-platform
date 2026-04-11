"use client";

import React, { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AIPostGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (text: string) => void;
}

export default function AIPostGeneratorModal({ isOpen, onClose, onGenerate }: AIPostGeneratorModalProps) {
    const [topic, setTopic] = useState("");
    const [salary, setSalary] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast.error("Vui lòng nhập Chủ đề / Kêu gọi chính!");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch("/api/marketing/ai-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, salary, address, phone })
            });

            const data = await res.json();
            if (data.success && data.post_content) {
                toast.success("AI đã sinh nội dung thành công!");
                onGenerate(data.post_content);
                onClose(); // Đóng modal luôn
                // Reset form
                setTopic("");
                setSalary("");
                setAddress("");
                setPhone("");
            } else {
                throw new Error(data.error || "Không thể sinh nội dung");
            }
        } catch (err: any) {
            console.error(err);
            toast.error("Lỗi AI: " + (err.message || "Hãy thử lại sau."));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-indigo-100 bg-indigo-50/50">
                    <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        AI Soạn Bài Tự Động (Spintext)
                    </h3>
                    <button onClick={onClose} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-indigo-900 mb-1">Chủ đề / Mục đích chính <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder="VD: Tuyển dụng NVKD, tìm CTV bán hàng, xả kho cuối mùa..."
                            className="w-full text-sm p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-indigo-900 mb-1">Đãi ngộ / Mức lương</label>
                            <input
                                type="text"
                                value={salary}
                                onChange={e => setSalary(e.target.value)}
                                placeholder="VD: Lương 15-20tr, thưởng %..."
                                className="w-full text-sm p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-indigo-900 mb-1">SĐT Liên hệ</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="VD: 0987.654.321 (Zalo)"
                                className="w-full text-sm p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-indigo-900 mb-1">Địa chỉ làm việc / Mua hàng</label>
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="VD: 153 Đường ABC, Quận X"
                            className="w-full text-sm p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>AI sẽ trộn ngẫu nhiên các cấu trúc ngữ pháp có thể thay thế được như <code className="bg-amber-100 px-1 rounded">{"{Tuyệt|Hay|Tốt}"}</code> để bài viết của bạn mang ra đăng BOT 100 lần vẫn như 100 bài mới nhằm chống SPAM từ Facebook.</p>
                    </div>
                </div>

                <div className="p-5 border-t border-indigo-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        Đóng lại
                    </button>
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating}
                        className="px-5 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang Sinh Văn Bản...</>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> Bắt đầu tạo</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
