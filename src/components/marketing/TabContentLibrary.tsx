"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Plus, Trash2, X, Edit2, PlayCircle, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import FolderSelectorModal from "@/components/documents/FolderSelectorModal";

export default function TabContentLibrary() {
    const [contents, setContents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [category, setCategory] = useState('');
    const [messageText, setMessageText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null); // Để lưu url khi đang sửa
    
    // Nguồn media mới
    const [mediaSource, setMediaSource] = useState<'upload' | 'folder'>('upload');
    const [docFolderId, setDocFolderId] = useState<string | null>(null);
    const [docFolderName, setDocFolderName] = useState<string | null>(null);
    const [mediaCount, setMediaCount] = useState<number>(1);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

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

    const isVideo = (urlOrName: string) => {
        if (!urlOrName) return false;
        return urlOrName.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i);
    };

    const handleImageDrop = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setExistingImageUrl(null); // Người dùng tải file mới thì bỏ qua file cũ
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setCategory('');
        setMessageText('');
        setImageFile(null);
        setImagePreview(null);
        setExistingImageUrl(null);
        setMediaSource('upload');
        setDocFolderId(null);
        setDocFolderName(null);
        setMediaCount(1);
        setIsAdding(true);
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setCategory(item.category);
        setMessageText(item.message_text || '');
        setImageFile(null);
        setImagePreview(null);
        setExistingImageUrl(item.image_url);
        
        if (item.doc_folder_id) {
            setMediaSource('folder');
            setDocFolderId(item.doc_folder_id);
            setDocFolderName(item.doc_folder_name);
            setMediaCount(item.media_count || 1);
        } else {
            setMediaSource('upload');
            setDocFolderId(null);
            setDocFolderName(null);
            setMediaCount(1);
        }
        
        setIsAdding(true);
    };

    const handleSave = async () => {
        if (!messageText.trim() && !imageFile && !existingImageUrl) {
            return toast.error("Vui lòng nhập nội dung đăng bài hoặc tải file đính kèm!");
        }
        
        setIsSaving(true);
        let finalMediaUrl = existingImageUrl;

        // Xử lý Upload Ảnh/Video lên Supabase Storage
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { data, error } = await supabase.storage.from('bot_assets').upload(`uploads/${fileName}`, imageFile);
            
            if (error) {
                toast.error("Lỗi tải file lên Đám Mây: " + error.message);
                setIsSaving(false);
                return;
            }
            
            // Xây dựng URL Public
            const { data: linkData } = supabase.storage.from('bot_assets').getPublicUrl(`uploads/${fileName}`);
            finalMediaUrl = linkData.publicUrl;
        }

        const payload = {
            category: category || "Mặc định",
            message_text: messageText,
            image_url: mediaSource === 'upload' ? finalMediaUrl : null,
            doc_folder_id: mediaSource === 'folder' ? docFolderId : null,
            doc_folder_name: mediaSource === 'folder' ? docFolderName : null,
            media_count: mediaSource === 'folder' ? mediaCount : 1
        };

        if (editingId) {
            // Update
            const { error } = await supabase.from('bot_contents').update(payload).eq('id', editingId);
            if (error) {
                toast.error("Lỗi cập nhật: " + error.message);
            } else {
                toast.success("✅ Đã cập nhật Bài Đăng thành công!");
                setIsAdding(false);
                fetchContents();
            }
        } else {
            // Insert
            const { error } = await supabase.from('bot_contents').insert(payload);
            if (error) {
                toast.error("Lỗi lưu Kho: " + error.message);
            } else {
                toast.success("✅ Đã thêm Nội dung mồi vào Kho!");
                setIsAdding(false);
                fetchContents();
            }
        }
        
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này? Nó có thể làm hỏng chiến dịch đang chạy nếu gọi nhầm.")) return;
        
        const { error } = await supabase.from('bot_contents').delete().eq('id', id);
        if (!error) {
            toast.success("Đã xóa khỏi Kho");
            fetchContents();
        }
    };

    const renderPreview = (source: string, isFilePreview = false) => {
        if (isVideo(source) || (isFilePreview && imageFile?.type.startsWith('video/'))) {
            return (
                <div className="relative w-full h-[220px] bg-black flex items-center justify-center">
                    <video src={source} className="w-full h-full object-contain" controls />
                </div>
            );
        }
        return <img src={source} className="w-full h-[220px] object-cover" alt="Preview"/>;
    };

    const renderThumbnail = (url: string) => {
        if (isVideo(url)) {
            return (
                <div className="h-[200px] bg-slate-900 border-b border-slate-200 relative overflow-hidden group flex items-center justify-center">
                    <video src={url} className="w-full h-full object-cover opacity-60" />
                    <PlayCircle className="w-12 h-12 text-white absolute opacity-80 z-10 shadow-xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-0"></div>
                </div>
            );
        }
        return (
            <div className="h-[200px] bg-slate-100 border-b border-slate-200 relative overflow-hidden group">
                <img src={url} alt="asset" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">Kho Kịch Bản & Multi-media</h2>
                    <p className="text-sm text-slate-500 mt-1">Lưu trữ tập trung Status, Hình ảnh, Video trên Cloud để BOT điều phối ngẫu nhiên khi đăng bài.</p>
                </div>
                {!isAdding && (
                    <button onClick={handleOpenAdd} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md">
                        <Plus className="w-5 h-5" /> Thêm Bài Mới
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-top-4 shadow-sm">
                    <h3 className="font-bold text-indigo-900 mb-4 text-lg">
                        {editingId ? "Sửa Bài Đăng" : "Biên Tập Bài Đăng Mới"}
                    </h3>
                    
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
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-bold text-indigo-900">Nguồn Media đính kèm</label>
                                <div className="flex bg-indigo-100/50 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setMediaSource('upload')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${mediaSource === 'upload' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
                                    >
                                        Tải File Lẻ
                                    </button>
                                    <button 
                                        onClick={() => setMediaSource('folder')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${mediaSource === 'folder' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
                                    >
                                        Link Thư Mục
                                    </button>
                                </div>
                            </div>
                            
                            {mediaSource === 'upload' ? (
                                <>
                                    {imagePreview ? (
                                <div className="border border-indigo-200 bg-white rounded-xl overflow-hidden relative shadow-sm">
                                    {renderPreview(imagePreview, true)}
                                    <button onClick={() => {setImagePreview(null); setImageFile(null); setExistingImageUrl(null);}} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg z-20">
                                        <X className="w-4 h-4"/>
                                    </button>
                                </div>
                            ) : existingImageUrl ? (
                                <div className="border border-indigo-200 bg-white rounded-xl overflow-hidden relative shadow-sm">
                                    {renderPreview(existingImageUrl, false)}
                                    <button onClick={() => setExistingImageUrl(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg z-20" title="Xóa file cữ">
                                        <X className="w-4 h-4"/>
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-indigo-300 bg-white rounded-xl h-[220px] flex flex-col items-center justify-center p-6 text-center hover:bg-indigo-50 transition-colors shadow-sm">
                                    <input type="file" id="upload-media" className="hidden" accept="image/*, video/*" onChange={handleImageDrop} />
                                    <label htmlFor="upload-media" className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                                        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                                            <FolderOpen className="w-7 h-7 text-indigo-600"/>
                                        </div>
                                        <span className="text-sm font-bold text-indigo-700">Tải Ảnh/Video Lên Cloud</span>
                                        <span className="text-xs text-slate-500 mt-1">Dung lượng tối đa 50MB</span>
                                    </label>
                                </div>
                            )}
                            </>
                        ) : (
                                <div className="border border-indigo-200 bg-white rounded-xl p-5 shadow-sm min-h-[220px] flex flex-col items-center justify-center relative">
                                    {docFolderId ? (
                                        <div className="text-center w-full">
                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle2 className="w-8 h-8" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-lg flex items-center justify-center gap-2 mb-1">
                                                <FolderOpen className="w-5 h-5 text-indigo-500"/> {docFolderName}
                                            </h4>
                                            <p className="text-xs text-slate-500 mb-4 px-4 hidden md:block">
                                                Thư mục này hiện đang được liên kết làm tổng kho Media cho bài đăng này. Trong thẻ nhớ hiện tại mã ID: <span className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{docFolderId.substring(0,8)}</span>
                                            </p>
                                            
                                            <div className="bg-indigo-50/50 rounded-lg p-3 mx-4 mb-4 text-left border border-indigo-100">
                                                <label className="block text-xs font-bold text-indigo-800 mb-1">Số Lượng lấy ra (Mỗi lần BOT chạy ngẫu nhiên)</label>
                                                <div className="flex items-center">
                                                    <input 
                                                        type="number" min="1" max="10" 
                                                        value={mediaCount} 
                                                        onChange={e => setMediaCount(parseInt(e.target.value) || 1)}
                                                        className="w-20 px-3 py-1.5 border border-indigo-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-center"
                                                    />
                                                    <span className="text-sm font-medium text-slate-600 ml-3">Media (Ảnh / Video)</span>
                                                </div>
                                            </div>
                                            
                                            <button onClick={() => setIsFolderModalOpen(true)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors">
                                                Đổi Thư Mục Khác
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FolderOpen className="w-8 h-8" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 mb-2">Chưa chọn thư mục</h4>
                                            <p className="text-sm text-slate-500 mb-5 max-w-[250px] mx-auto">Kết nối với hệ thống Tài Liệu nội bộ để BOT bốc random ảnh đăng bài.</p>
                                            <button onClick={() => setIsFolderModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-md">
                                                Duyệt Kho Tài Liệu
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t border-indigo-200/50">
                        <button disabled={isSaving} onClick={handleSave} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-md shadow-indigo-500/30 flex items-center gap-2">
                            {isSaving ? "Đang đẩy/Cập nhật dữ liệu..." : "Lưu Trữ Ngay"}
                        </button>
                        <button disabled={isSaving} onClick={() => setIsAdding(false)} className="px-6 py-2.5 bg-white border border-indigo-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all">Hủy bỏ</button>
                    </div>
                </div>
            )}
            
            <FolderSelectorModal 
                isOpen={isFolderModalOpen} 
                onClose={() => setIsFolderModalOpen(false)} 
                onSelect={(id, name) => {
                    setDocFolderId(id);
                    setDocFolderName(name);
                    setIsFolderModalOpen(false);
                }} 
            />

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
                        <div key={c.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group hover:-translate-y-1 flex flex-col">
                            {/* Khung chứa Media (Nếu có) */}
                            {c.image_url ? renderThumbnail(c.image_url) : c.doc_folder_id ? (
                                <div className="h-[200px] bg-indigo-50 flex items-center justify-center flex-col p-4 border-b border-indigo-100">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-wrap gap-1 p-2 shadow-sm mb-3">
                                        <ImageIcon className="w-5 h-5 text-indigo-400" />
                                        <ImageIcon className="w-5 h-5 text-indigo-500" />
                                        <ImageIcon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <span className="text-center font-bold text-indigo-900 border-b border-indigo-200 pb-1 mb-2 line-clamp-1">{c.doc_folder_name}</span>
                                    <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                        Ngẫu nhiên x{c.media_count || 1}
                                    </span>
                                </div>
                            ) : (
                                <div className="h-4 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                            )}

                            <div className="p-5 relative bg-white z-10 flex flex-col h-full flex-1">
                                <div className="absolute top-4 right-4 flex items-center gap-1">
                                    <button onClick={() => handleEdit(c)} className="text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 p-1.5 rounded-md border border-slate-100">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 p-1.5 rounded-md border border-slate-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-extrabold px-3 py-1 rounded-full w-fit mb-3 tracking-wider max-w-full truncate">
                                    📁 {c.category}
                                </span>
                                
                                <p className="text-slate-700 text-sm italic font-medium line-clamp-4 leading-relaxed whitespace-pre-line flex-1 mt-1">
                                    {c.message_text ? `"${c.message_text}"` : <span className="text-slate-400">Không có text, chỉ đăng File.</span>}
                                </p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
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
