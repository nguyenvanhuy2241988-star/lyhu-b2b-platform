"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export default function TabContentLibrary() {
    const [contents, setContents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [category, setCategory] = useState('');
    const [messageText, setMessageText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchContents = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('bot_contents').select('*').order('created_at', { ascending: false });
        if (data) setContents(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchContents();
    }, []);

    const handleImageDrop = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAdd = async () => {
        if (!messageText.trim() && !imageFile) return toast.error("Vui lòng nhập nội dung đăng bài hoặc tải ảnh!");
        
        setIsSaving(true);
        let imageUrl = null;

        // Xử lý Upload Ảnh lên Supabase Storage
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { data, error } = await supabase.storage.from('bot_assets').upload(`uploads/${fileName}`, imageFile);
            
            if (error) {
                toast.error("Lỗi tải ảnh lên Đám Mây: " + error.message);
                setIsSaving(false);
                return;
            }
            
            // Xây dựng URL Public
            const { data: linkData } = supabase.storage.from('bot_assets').getPublicUrl(`uploads/${fileName}`);
            imageUrl = linkData.publicUrl;
        }

        // Lưu vào Database
        const { error } = await supabase.from('bot_contents').insert({
            category,
            message_text: messageText,
            image_url: imageUrl
        });

        if (error) {
            toast.error("Lỗi lưu Kho: " + error.message);
        } else {
            toast.success("✅ Đã thêm Nội dung mồi vào Kho!");
            setIsAdding(false);
            setMessageText('');
            setImageFile(null);
            setImagePreview(null);
            fetchContents();
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string, imgUrl: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;
        
        const { error } = await supabase.from('bot_contents').delete().eq('id', id);
        if (!error) {
            toast.success("Đã xóa khỏi Kho");
            fetchContents();
        }
    };

    return (
        <div className="p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">Kho Kịch Bản & Multi-media</h2>
                    <p className="text-sm text-slate-500 mt-1">Lưu trữ tập trung Status và Hình ảnh trên Cloud để BOT điều phối ngẫu nhiên khi đăng bài.</p>
                </div>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md">
                        <Plus className="w-5 h-5" /> Thêm Bài Mới
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-indigo-900 mb-4 text-lg">Biên Tập Bài Đăng Mới</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cột trái: Phân loại & Chữ */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-indigo-900 mb-1">Loại Nhóm Mồi (Thư mục)</label>
                                <input
                                    type="text"
                                    list="category-suggestions"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    placeholder="Gõ tên nhóm mới hoặc chọn nhóm cũ..."
                                    className="w-full text-sm p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                                />
                                <datalist id="category-suggestions">
                                    {Array.from(new Set(contents.map(c => c.category))).map(cat => (
                                        <option key={cat as string} value={cat as string} />
                                    ))}
                                    <option value="Kho Bán Hàng" />
                                    <option value="Kho Thả Thính" />
                                    <option value="Kho Seeding" />
                                    <option value="Mặc định" />
                                </datalist>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-indigo-900 mb-1">
                                    Nội dung Chữ (Hỗ trợ <span className="text-indigo-500 bg-indigo-100 px-1 rounded mx-1">{"{Chào|Hi|Alo}"}</span> quay vòng)
                                </label>
                                <textarea rows={6} value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Chào mọi người, sáng nay mình có lô hàng mới... (Kèm Link web/SĐT nếu có)" className="w-full text-sm p-3 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none shadow-sm"></textarea>
                            </div>
                        </div>

                        {/* Cột phải: Khung ảnh đính kèm */}
                        <div>
                            <label className="block text-sm font-bold text-indigo-900 mb-1">Media Đính Kèm (Ảnh)</label>
                            {imagePreview ? (
                                <div className="border border-indigo-200 bg-white rounded-xl overflow-hidden relative shadow-sm">
                                    <img src={imagePreview} className="w-full h-[220px] object-cover" alt="Preview"/>
                                    <button onClick={() => {setImagePreview(null); setImageFile(null)}} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg">
                                        <X className="w-4 h-4"/>
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-indigo-300 bg-white rounded-xl h-[220px] flex flex-col items-center justify-center p-6 text-center hover:bg-indigo-50 transition-colors shadow-sm">
                                    <input type="file" id="upload-media" className="hidden" accept="image/*" onChange={handleImageDrop} />
                                    <label htmlFor="upload-media" className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                                        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                                            <FolderOpen className="w-7 h-7 text-indigo-600"/>
                                        </div>
                                        <span className="text-sm font-bold text-indigo-700">Tải Ảnh Từ Máy Tính Lên Cloud</span>
                                        <span className="text-xs text-slate-500 mt-1">Dung lượng tối đa 10MB</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t border-indigo-200/50">
                        <button disabled={isSaving} onClick={handleAdd} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-md shadow-indigo-500/30 flex items-center gap-2">
                            {isSaving ? "Đang đẩy lên Đám Mây..." : "Lưu Trữ Ngay"}
                        </button>
                        <button disabled={isSaving} onClick={() => setIsAdding(false)} className="px-6 py-2.5 bg-white border border-indigo-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all">Hủy bỏ</button>
                    </div>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="text-center py-20 text-slate-500 font-medium animate-pulse">Đang quét Cloud Storage...</div>
            ) : contents.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-2xl bg-slate-50 p-16 text-center">
                    <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-700 text-lg">Kho Dữ Liệu Đang Trống</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">Tạo sẵn những bài đăng mẫu để các BOT chạy Chiến Dịch liên hoàn bốc ra dùng ngẫu nhiên.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {contents.map((c) => (
                        <div key={c.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group hover:-translate-y-1">
                            {/* Khung chứa Ảnh (Nếu có) */}
                            {c.image_url ? (
                                <div className="h-[200px] bg-slate-100 border-b border-slate-200 relative overflow-hidden group">
                                    <img src={c.image_url} alt="asset" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                </div>
                            ) : (
                                <div className="h-4 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                            )}

                            <div className="p-5 relative bg-white z-10 flex flex-col h-[200px]">
                                <button onClick={() => handleDelete(c.id, c.image_url)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors bg-white/80 p-1 rounded-md">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-extrabold px-3 py-1 rounded-full w-fit mb-3 tracking-wider">
                                    📁 {c.category}
                                </span>
                                
                                <p className="text-slate-700 text-sm italic font-medium line-clamp-4 leading-relaxed whitespace-pre-line flex-1">
                                    {c.message_text ? `"${c.message_text}"` : <span className="text-slate-400">Không có text, chỉ đăng ảnh.</span>}
                                </p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <span className="text-xs text-slate-400 font-mono">
                                        ID: {c.id.split('-')[0]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
