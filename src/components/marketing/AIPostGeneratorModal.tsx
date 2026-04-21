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
    const [templateText, setTemplateText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;


    const handleGenerate = async () => {
        if (!templateText.trim() || templateText.length < 50) {
            toast.error("Vui lòng nhập văn bản gốc đủ dài (ít nhất 50 ký tự)!");
            return;
        }

        if (templateText.length > 5000) {
            toast.error("Văn bản gốc quá dài, tối đa khoảng 5000 ký tự!");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch("/api/marketing/ai-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateText })
            });

            const data = await res.json();
            if (res.status === 413) {
                 throw new Error("Dung lượng tải lên vượt giới hạn máy chủ.");
            }

            if (data.success && data.post_content) {
                toast.success("AI đã tạo Spintax thành công!");
                onGenerate(data.post_content);
                onClose();
                setTemplateText("");
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
                        AI Tạo Spintext Từ Bài Mẫu
                    </h3>
                    <button onClick={onClose} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col min-h-[300px]">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>Dán 1 hoặc NHIỀU bài viết mẫu của bạn vào bên dưới (cách nhau bởi vạch ngang hoặc xuống dòng). AI sẽ tự tìm từ đồng nghĩa biến chúng thành dạng Spintax <code className="bg-amber-100 px-1 rounded">{"{Tuyệt|Hay|Tốt}"}</code> và trộn ngẫu nhiên để lách Bot Facebook.</p>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-bold text-indigo-900 mb-2">Nhập các bài viết mẫu (Tối đa ~5000 ký tự) <span className="text-red-500">*</span></label>
                        <textarea
                            value={templateText}
                            onChange={e => setTemplateText(e.target.value)}
                            placeholder={"Ví dụ:\nKhoai môn nhúng vị CVT ăn là nghiền, đang tuyển nhà phân phối toàn quốc chiết khấu 45%\n---\nKèo thơm cho anh em sỉ, Khoai môn CVT 4 vị ngon bá cháy..."}
                            className="w-full flex-1 text-sm p-4 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                            maxLength={5000}
                        ></textarea>
                        <div className="text-right mt-1">
                            <span className={`text-xs font-medium ${templateText.length > 4800 ? 'text-red-500' : 'text-slate-400'}`}>
                                {templateText.length} / 5000
                            </span>
                        </div>
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
