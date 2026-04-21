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
    const [postType, setPostType] = useState("distributor"); // 'sales', 'recruitment', 'distributor'
    const [brand, setBrand] = useState("");
    const [benefit, setBenefit] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [extraInfo, setExtraInfo] = useState("");
    const [imagesBase64, setImagesBase64] = useState<string[]>([]);
    const [imageFileNames, setImageFileNames] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Giới hạn 3 ảnh để tránh quá tải
        const filesToProcess = files.slice(0, 3);
        setImageFileNames(filesToProcess.map(f => f.name));

        const base64Promises = filesToProcess.map(file => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
        });

        const newBase64s = await Promise.all(base64Promises);
        setImagesBase64(newBase64s);
    };

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
                body: JSON.stringify({ postType, topic, benefit, address, phone, brand, extraInfo, imagesBase64 })
            });

            const data = await res.json();
            if (data.success && data.post_content) {
                toast.success("AI đã sinh nội dung thành công!");
                onGenerate(data.post_content);
                onClose(); // Đóng modal luôn
                // Reset form
                setTopic("");
                setBrand("");
                setBenefit("");
                setAddress("");
                setPhone("");
                setExtraInfo("");
                setImagesBase64([]);
                setImageFileNames([]);
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
                        <label className="block text-sm font-bold text-indigo-900 mb-2">Loại bài đăng</label>
                        <div className="flex gap-3">
                            <label className={`flex-1 border rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${postType === 'sales' ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                <input type="radio" name="postType" value="sales" checked={postType === 'sales'} onChange={() => setPostType('sales')} className="hidden" />
                                <span className="text-sm font-bold text-slate-700">🛒 Bán Hàng</span>
                            </label>
                            <label className={`flex-1 border rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${postType === 'distributor' ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                <input type="radio" name="postType" value="distributor" checked={postType === 'distributor'} onChange={() => setPostType('distributor')} className="hidden" />
                                <span className="text-sm font-bold text-slate-700">🤝 Tìm Đại Lý</span>
                            </label>
                            <label className={`flex-1 border rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer transition-colors ${postType === 'recruitment' ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                <input type="radio" name="postType" value="recruitment" checked={postType === 'recruitment'} onChange={() => setPostType('recruitment')} className="hidden" />
                                <span className="text-sm font-bold text-slate-700">💼 Tuyển Dụng</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-indigo-900 mb-1">Chủ đề / Mục đích chính <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder={postType === 'distributor' ? "VD: Tìm đại lý phân phối độc quyền..." : postType === 'recruitment' ? "VD: Tuyển gấp NVKD..." : "VD: Xả kho hàng mùa hè..."}
                            className="w-full text-sm p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-indigo-900 mb-1">Nhãn hàng / Sản phẩm (Nếu có)</label>
                            <input
                                type="text"
                                value={brand}
                                onChange={e => setBrand(e.target.value)}
                                placeholder="VD: Sữa tắm Gilaa, Dịch vụ FPT..."
                                className="w-full text-sm p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-indigo-900 mb-1">{postType === 'recruitment' ? 'Mức lương / Đãi ngộ' : 'Chính sách Chiết khấu / Quyền lợi'}</label>
                            <input
                                type="text"
                                value={benefit}
                                onChange={e => setBenefit(e.target.value)}
                                placeholder={postType === 'recruitment' ? "VD: Lương 15-20tr..." : "VD: Chiết khấu 30%..."}
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

                    <div>
                        <label className="block text-sm font-bold text-indigo-900 mb-1">Thông tin bổ sung / Yêu cầu chi tiết (Tùy chọn)</label>
                        <textarea
                            rows={3}
                            value={extraInfo}
                            onChange={e => setExtraInfo(e.target.value)}
                            placeholder="VD: Hàng tự sản xuất không qua trung gian, bao đổi trả hàng cận date, vốn nhập chỉ từ 2 triệu..."
                            className="w-full text-sm p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-indigo-900 mb-1">Upload Ảnh Sản phẩm (Tối đa 3 ảnh)</label>
                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 w-full justify-center">
                                <Sparkles className="w-4 h-4" />
                                {imageFileNames.length > 0 ? `Đã Chọn ${imageFileNames.length} Ảnh (Bấm đổi)` : "Tải Ảnh Lên Để AI Trích Xuất (Hỗ trợ chọn nhiều)"}
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                            </label>
                            {imageFileNames.length > 0 && (
                                <button onClick={() => {setImagesBase64([]); setImageFileNames([]);}} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors shrink-0" title="Xóa ảnh">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {imageFileNames.length > 0 && <p className="text-xs text-indigo-600 mt-2 font-medium truncate">Đang đính kèm: {imageFileNames.join(", ")}</p>}
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
