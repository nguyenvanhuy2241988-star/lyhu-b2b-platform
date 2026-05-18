"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { 
    BookOpen,
    Info, 
    Palette, 
    Scale, 
    HeartHandshake, 
    Map,
    ArrowRight,
    MapPin,
    Building2,
    Award,
    CheckCircle2,
    ImageIcon,
    Quote,
    Save,
    Edit3,
    Shapes,
    Eye,
    X,
    Menu,
    ChevronDown,
    Globe,
    Facebook,
    Video,
    ShoppingBag,
    Youtube,
    Instagram,
    AtSign
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/AuthProvider";

// --- CONTEXT CHO CMS ---
const CultureContext = createContext<any>(null);

function EditableLink({ id, icon: Icon, defaultUrl, label }: { id: string, icon: any, defaultUrl?: string, label: string }) {
    const { content, isEditMode, updateContent } = useContext(CultureContext);
    const val = content[id] !== undefined ? content[id] : defaultUrl;

    if (!isEditMode) {
        if (!val) return null;
        
        let href = val;
        if (href && !href.startsWith('http://') && !href.startsWith('https://')) {
            href = 'https://' + href;
        }

        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-500 hover:text-teal-600 transition-colors text-xs font-medium bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 hover:border-teal-200 w-fit">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </a>
        );
    }

    return (
        <div className="flex items-center gap-2 w-full text-xs">
            <Icon className="w-4 h-4 text-slate-400 shrink-0" title={label} />
            <input 
                type="text" 
                className="w-full p-1.5 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:border-teal-500 text-xs shadow-sm" 
                value={val || ''} 
                onChange={e => updateContent(id, e.target.value)} 
                placeholder={`Link ${label}...`}
            />
        </div>
    );
}

function EditableText({ id, defaultText, className = "", multiline = false }: { id: string, defaultText: string | React.ReactNode, className?: string, multiline?: boolean }) {
    const { content, isEditMode, updateContent } = useContext(CultureContext);
    const val = content[id] !== undefined ? content[id] : defaultText;

    if (!isEditMode) return <span className={className}>{val}</span>;

    if (multiline) {
        return <textarea 
            className={`w-full p-3 border-2 border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[120px] transition-all resize-none shadow-sm ${className}`} 
            value={val} 
            onChange={e => updateContent(id, e.target.value)} 
            placeholder="Nhập nội dung..."
        />
    }
    return <input 
        type="text" 
        className={`w-full p-2 border-2 border-slate-200 bg-slate-50 rounded-lg focus:outline-none shadow-sm transition-all ${className}`} 
        value={val} 
        onChange={e => updateContent(id, e.target.value)} 
        placeholder="Nhập nội dung..."
    />
}

function EditableImage({ id, label = "Ảnh", className = "aspect-video", optional = false }: { id: string, label?: string, className?: string, optional?: boolean }) {
    const { content, isEditMode, updateContent, uploadImage, uploadingId } = useContext(CultureContext);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const imageUrl = content[id];
    const shape = content[`${id}_shape`];
    const size = content[`${id}_size`];
    const radius = content[`${id}_radius`];
    const isUploading = uploadingId === id;

    let dynamicClasses = "";
    if (shape === 'square') dynamicClasses += " !aspect-square !rounded-2xl";
    else if (shape === 'portrait') dynamicClasses += " !aspect-[3/4] !rounded-2xl";
    else if (shape === 'video') dynamicClasses += " !aspect-video !rounded-2xl";
    else if (shape === 'cinema') dynamicClasses += " !aspect-[21/9] !rounded-2xl";
    else if (shape === 'circle') dynamicClasses += " !aspect-square !rounded-full";
    else if (shape === 'auto') dynamicClasses += " !aspect-auto !rounded-2xl";

    if (size === 'sm') dynamicClasses += " !w-full !max-w-[150px] !mx-auto";
    else if (size === 'md') dynamicClasses += " !w-full !max-w-[300px] !mx-auto";
    else if (size === 'lg') dynamicClasses += " !w-full !max-w-[500px] !mx-auto";
    else if (size === 'full') dynamicClasses += " !w-full !max-w-none";

    if (radius === 'none') dynamicClasses += " !rounded-none";

    const finalClasses = `${className} ${dynamicClasses}`.trim();

    if (!isEditMode) {
        if (!imageUrl) {
            if (optional) return null;
            return (
                <div className={`w-full flex-col items-center justify-center text-slate-400 outline-none flex bg-slate-100 ${finalClasses}`}>
                    <ImageIcon className="w-8 h-8 opacity-50" />
                </div>
            );
        }
        return (
            <div className={`relative overflow-hidden flex items-center justify-center group/preview cursor-pointer ${finalClasses}`} onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(true); }}>
                <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover outline-none" />
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity z-10 pointer-events-none backdrop-blur-[2px]">
                    <div className="bg-white/20 p-3 rounded-full text-white backdrop-blur-md shadow-sm border border-white/20 transform scale-50 group-hover/preview:scale-100 transition-transform">
                        <Eye className="w-6 h-6" />
                    </div>
                </div>
                {isPreviewOpen && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col items-center justify-center p-4 backdrop-blur-md !cursor-default" onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(false); }}>
                        <button className="absolute top-6 right-6 text-white/50 hover:text-white transition bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer z-50 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(false); }}>
                            <X className="w-8 h-8" />
                        </button>
                        <img src={imageUrl} alt={label} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    return (
        <div className={`relative group border-2 border-dashed border-slate-200 flex items-center justify-center hover:z-50 ${finalClasses}`}>
           {imageUrl ? <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-60 rounded-[inherit]" /> : <div className="absolute inset-0 w-full h-full bg-teal-50 rounded-[inherit]" />}

           <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[inherit] z-10 backdrop-blur-sm pointer-events-none"></div>
           
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
               {isUploading ? (
                   <span className="text-white text-sm font-bold flex items-center gap-2 whitespace-nowrap bg-slate-900/80 px-4 py-2 rounded-xl shadow-sm">
                       <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> 
                       Đang tải ảnh...
                   </span>
               ) : (
                   <div className="flex flex-col items-center gap-3 w-max p-2 hover:z-50">
                       {/* Upload Button */}
                       <label className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-bold flex items-center gap-2 shadow-sm mb-1 pointer-events-auto transition hover:scale-105 active:scale-95">
                           <ImageIcon className="w-4 h-4" /> Chọn ảnh mới
                           <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={e => uploadImage(id, e.target.files?.[0])} 
                           />
                       </label>

                       {/* Controls Panel */}
                       <div className="flex flex-col gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700 shadow-sm pointer-events-auto" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center gap-2 text-xs">
                               <span className="text-slate-300 w-10 font-medium tracking-wide">DÁNG:</span>
                               <button onClick={() => updateContent(`${id}_shape`, 'square')} className={`p-1.5 rounded transition ${shape==='square'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Vuông">⏹️</button>
                               <button onClick={() => updateContent(`${id}_shape`, 'portrait')} className={`p-1.5 rounded transition ${shape==='portrait'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Dọc A4">📄</button>
                               <button onClick={() => updateContent(`${id}_shape`, 'video')} className={`p-1.5 rounded transition ${shape==='video'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Ngang">🖥️</button>
                               <button onClick={() => updateContent(`${id}_shape`, 'cinema')} className={`p-1.5 rounded transition ${shape==='cinema'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Banner">▭</button>
                               <button onClick={() => updateContent(`${id}_shape`, 'circle')} className={`p-1.5 rounded transition ${shape==='circle'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Tròn">🔵</button>
                               <button onClick={() => updateContent(`${id}_shape`, '')} className={`p-1.5 rounded font-bold transition ${!shape?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Mặc định">MĐ</button>
                           </div>
                           <div className="flex items-center gap-2 text-xs">
                               <span className="text-slate-300 w-10 font-medium tracking-wide">CỠ:</span>
                               <button onClick={() => updateContent(`${id}_size`, 'sm')} className={`px-2 py-1 rounded font-bold transition ${size==='sm'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>S</button>
                               <button onClick={() => updateContent(`${id}_size`, 'md')} className={`px-2 py-1 rounded font-bold transition ${size==='md'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>M</button>
                               <button onClick={() => updateContent(`${id}_size`, 'lg')} className={`px-2 py-1 rounded font-bold transition ${size==='lg'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>L</button>
                               <button onClick={() => updateContent(`${id}_size`, 'full')} className={`px-2 py-1 rounded font-bold transition ${size==='full'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Full</button>
                               <button onClick={() => updateContent(`${id}_size`, '')} className={`px-2 py-1 rounded font-bold transition ${!size?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>MĐ</button>
                           </div>
                           <div className="flex items-center gap-2 text-xs border-t border-slate-700/50 pt-2 mt-0.5">
                               <span className="text-slate-300 w-10 font-medium tracking-wide">GÓC:</span>
                               <button onClick={() => updateContent(`${id}_radius`, 'none')} className={`px-2 py-1 rounded font-bold transition ${radius==='none'?'bg-red-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Bỏ bo góc (Vuông vắn)">0px</button>
                               <button onClick={() => updateContent(`${id}_radius`, '')} className={`px-2 py-1 rounded font-bold transition ${!radius?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Bo góc mặc định theo khung">MĐ</button>
                               
                               {imageUrl && (
                                   <button onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(true); }} className="ml-auto flex items-center gap-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition pointer-events-auto" title="Xem trước ảnh">
                                       <Eye className="w-3 h-3" /> Xem
                                   </button>
                               )}
                           </div>
                       </div>
                   </div>
               )}
           </div>

           {/* Preview Modal in Edit Mode */}
           {isPreviewOpen && imageUrl && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-default" onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(false); }}>
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white transition bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer z-50 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(false); }}>
                        <X className="w-8 h-8" />
                    </button>
                    <img src={imageUrl} alt={label} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
                </div>,
                document.body
           )}
        </div>
    );
}

// --- MAIN PAGE ---
export default function CulturePage() {
    const { role } = useAuth();
    const [activeTab, setActiveTab] = useState('intro');
    const [content, setContent] = useState<Record<string, any>>({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const supabase = createClient();
    const { showToast } = useToast();

    // MÀU THƯƠNG HIỆU
    const BRAND = { teal: '#00afa9', green: '#98c93c' };

    const TABS = [
        { id: 'intro', label: "Thông điệp mở đầu", icon: Info },
        { id: 'brand', label: "ADN Thương hiệu", icon: Palette },
        { id: 'logo', label: "Thiết kế & Ý nghĩa Logo", icon: Shapes },
        { id: 'core', label: "Giá trị cốt lõi 3K1C", icon: Scale },
        { id: 'philosophy', label: "Triết lý hành động", icon: HeartHandshake },
        { id: 'brands', label: "Lĩnh vực & Nhãn hàng", icon: Award },
        { id: 'vision', label: "Định hướng tương lai", icon: Map },
    ];

    // Load CMS Data
    useEffect(() => {
        async function loadContent() {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('culture_settings')
                    .select('content')
                    .eq('slug', 'main_content')
                    .single();

                if (data && data.content) {
                    setContent(data.content);
                }
            } catch (err) {
                console.log("No config found or error fetching config", err);
            }
            setIsLoading(false);
        }
        loadContent();
    }, []);

    // Handlers
    const updateContent = (key: string, value: string) => {
        setContent(prev => ({ ...prev, [key]: value }));
    };

    const goToNextTab = () => {
        const currentIndex = TABS.findIndex(t => t.id === activeTab);
        if (currentIndex < TABS.length - 1) {
            setActiveTab(TABS[currentIndex + 1].id);
            // Scroll right pane to top
            const container = document.getElementById('culture-scroll-container');
            if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const uploadImage = async (id: string, file: File | undefined) => {
        if (!file) return;
        setUploadingId(id);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `culture_${id}_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(`culture/${fileName}`, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('media').getPublicUrl(`culture/${fileName}`);
            updateContent(id, data.publicUrl);
        } catch (err: any) {
            showToast("Lỗi upload ảnh: " + err.message, "error");
        }
        setUploadingId(null);
    };

    const saveChanges = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('culture_settings')
                .upsert({ slug: 'main_content', content: content }, { onConflict: 'slug' });

            if (error) throw error;
            showToast("Đã lưu nội dung cẩm nang thành công!", "success");
            setIsEditMode(false);
        } catch (err: any) {
            showToast("Lỗi khi lưu bảng db: " + err.message, "error");
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <DashboardShell title="Văn hóa doanh nghiệp"><div className="p-8 text-center animate-pulse text-slate-500">Đang nạp dữ liệu cẩm nang...</div></DashboardShell>
    }

    return (
        <CultureContext.Provider value={{ content, isEditMode, updateContent, uploadImage, uploadingId, goToNextTab, activeTab, TABS }}>
            <DashboardShell title="Văn hóa doanh nghiệp">
                <div className="min-h-[calc(100vh-4rem)] bg-white flex flex-col -m-4 md:-m-8">
                    {/* Header - Sticky Top */}
                    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 hidden sm:flex">
                                <BookOpen className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <div className="text-[10px] font-medium tracking-wide text-slate-400 mb-0.5">Cẩm nang nội bộ LYHU</div>
                                <h1 className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight">Văn Hóa Doanh Nghiệp</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isEditMode ? (
                                <>
                                    <button onClick={() => setIsEditMode(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-100 rounded-full max-md:hidden shadow-sm hover:bg-slate-50 transition-colors">
                                        Hủy Sửa
                                    </button>
                                    <button onClick={saveChanges} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-slate-900 rounded-full shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-70">
                                        <Save className="w-4 h-4" />
                                        <span className="hidden sm:inline">{isSaving ? "Đang lưu..." : "Lưu Cẩm Nang"}</span>
                                        <span className="sm:hidden">{isSaving ? "..." : "Lưu"}</span>
                                    </button>
                                </>
                            ) : (
                                role === 'admin' && (
                                    <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-100 rounded-full shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors tooltip group" title="Bật lên để thay ảnh, gắn chữ">
                                        <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                        <span className="hidden sm:inline">Biên Tập Nội Dung</span>
                                        <span className="sm:hidden">Biên Tập</span>
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Content Body - 2 Columns */}
                    <div className="flex flex-1 overflow-hidden w-full mx-auto max-w-[1400px]">
                        {/* LEFT SIDEBAR (Mục Lục) */}
                        <div className="hidden lg:block w-72 shrink-0 border-r border-slate-100 bg-slate-50/30 overflow-y-auto h-[calc(100vh-73px)] sticky top-[73px]">
                            <div className="p-8 pt-12">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                                    Mục Lục
                                </div>
                                <nav className="flex flex-col gap-1.5 relative">
                                    {TABS.map((tab) => {
                                        const isActive = tab.id === activeTab;
                                        const Icon = tab.icon;
                                        return (
                                            <div 
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                                                    isActive 
                                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50 font-medium" 
                                                    : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
                                                }`}
                                            >
                                                {isActive && <div className="absolute -left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-slate-800 rounded-r-full" />}
                                                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-slate-800' : 'text-slate-400'}`} />
                                                <span className="text-[14px] leading-tight">{tab.label}</span>
                                            </div>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* RIGHT CONTENT AREA */}
                        <div id="culture-scroll-container" className="flex-1 flex flex-col h-[calc(100vh-73px)] overflow-y-auto w-full relative bg-white">
                            {/* Mobile Nav Top Bar */}
                            <div className="lg:hidden border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-40">
                                <button 
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                                    className="w-full p-4 flex items-center justify-between text-slate-800 font-medium"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                            <Menu className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <span>{TABS.find(t => t.id === activeTab)?.label}</span>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isMobileMenuOpen && (
                                    <div className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-sm overflow-y-auto max-h-[60vh] z-50">
                                        <div className="p-2 space-y-1">
                                            {TABS.map((tab) => {
                                                const isActive = tab.id === activeTab;
                                                const Icon = tab.icon;
                                                return (
                                                    <div 
                                                        key={tab.id}
                                                        onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${isActive ? 'bg-slate-50 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        {tab.label}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-full max-w-4xl mx-auto p-6 md:p-12 lg:p-16 xl:p-24 pb-32">
                                {activeTab === 'intro' && <IntroductionView brand={BRAND} />}
                                {activeTab === 'brand' && <BrandIdentityView brand={BRAND} />}
                                {activeTab === 'logo' && <LogoView brand={BRAND} />}
                                {activeTab === 'core' && <CoreValuesView brand={BRAND} />}
                                {activeTab === 'philosophy' && <PhilosophyView brand={BRAND} />}
                                {activeTab === 'brands' && <BrandsView brand={BRAND} />}
                                {activeTab === 'vision' && <VisionView brand={BRAND} />}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardShell>
        </CultureContext.Provider>
    );
}

/* =========================================
   UI VIEWS W/ EDITABLE CONTEXT
   ========================================= */

function NextTabButton() {
    const { activeTab, TABS, goToNextTab } = useContext(CultureContext);
    const currentIndex = TABS.findIndex((t: any) => t.id === activeTab);
    
    if (currentIndex >= TABS.length - 1) return null;
    
    const nextTab = TABS[currentIndex + 1];
    
    return (
        <div className="mt-20 pt-10 border-t border-slate-100 flex justify-center">
            <button onClick={goToNextTab} className="group flex items-center gap-3 text-slate-500 hover:text-teal-600 transition-colors px-6 py-3 rounded-full hover:bg-slate-50">
                <span className="font-medium tracking-wide uppercase text-sm">Chuyển sang: {nextTab.label}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
        </div>
    );
}

function IntroductionView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-16">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight uppercase"><EditableText id="intro_main_title" defaultText="Thông Điệp Từ Ban Lãnh Đạo" /></h1>
                <div className="h-1 w-16 mt-4" style={{ backgroundColor: brand.teal }}></div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className="flex-1 space-y-6 text-slate-600 text-lg leading-relaxed w-full">
                    <p><strong><EditableText id="intro_greeting" defaultText="Thân gửi toàn thể nhân sự LYHU," /></strong></p>
                    <div className="flex flex-col gap-4">
                        <EditableText id="intro_p1" multiline defaultText="Từ những ngày đầu khởi nghiệp, chúng ta đã cùng nhau vượt qua nhiều thử thách. LYHU được xây dựng bằng sự nỗ lực, niềm tin và tinh thần gắn kết của từng thành viên." />
                        <EditableText id="intro_p2" multiline defaultText="Chúng tôi tin rằng, kinh doanh không chỉ là bán sản phẩm, mà còn là tạo ra một môi trường làm việc để mọi người cảm thấy được tôn trọng, cùng nhau trưởng thành và phát triển bền vững." />
                        <EditableText id="intro_p3" multiline defaultText="Cuốn 'Văn hóa Doanh nghiệp LYHU' này là nơi chúng ta ghi lại những giá trị chung để nhắc nhở và định hướng mỗi ngày. Văn hóa không phải điều xa vời, mà là cách chúng quy chuẩn trong cách chúng ta làm việc, ứng xử, chia sẻ và gắn bó với nhau." />
                    </div>

                    <div className="pt-6 mt-8 border-t border-slate-100">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wide">
                            <EditableText id="intro_slogan" defaultText="KẾT NỐI CHÂN THÀNH – HỢP TÁC BỀN VỮNG" className="!w-full block" />
                        </h4>
                        <p className="mt-2 text-slate-500 italic">Trân trọng,</p>
                        <p className="font-semibold text-slate-800 text-xl tracking-wide mt-1" style={{ color: brand.teal }}>
                            <EditableText id="intro_sign" defaultText="Ban Lãnh đạo LYHU" />
                        </p>
                    </div>
                </div>

                <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-4">
                    <EditableImage id="img_intro_banner" className="aspect-[3/4] w-full" label="Ảnh chính (Tòa nhà/Lãnh đạo)" />
                    <div className="grid grid-cols-2 gap-4">
                        <EditableImage id="img_intro_sub_1" className="aspect-square w-full" label="Ảnh phụ 1 (Tùy chọn)" optional />
                        <EditableImage id="img_intro_sub_2" className="aspect-square w-full" label="Ảnh phụ 2 (Tùy chọn)" optional />
                        <EditableImage id="img_intro_sub_3" className="aspect-square w-full" label="Ảnh phụ 3 (Tùy chọn)" optional />
                        <EditableImage id="img_intro_sub_4" className="aspect-square w-full" label="Ảnh phụ 4 (Tùy chọn)" optional />
                        <EditableImage id="img_intro_sub_5" className="aspect-square w-full" label="Ảnh phụ 5 (Tùy chọn)" optional />
                        <EditableImage id="img_intro_sub_6" className="aspect-square w-full" label="Ảnh phụ 6 (Tùy chọn)" optional />
                    </div>
                </div>
            </div>

            <div className="pt-8 w-full border-t border-slate-100 mt-12 hidden">
                <h3 className="text-2xl font-bold text-slate-800 mb-8 text-center tracking-wide">4 TRỤ CỘT HOẠT ĐỘNG</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {["Sản xuất", "Nhập khẩu", "Thương mại", "Bán lẻ"].map((label, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-stretch text-center shadow-sm hover:shadow-sm transition-shadow">
                            <EditableImage id={`img_pillar_${i}`} className="w-full aspect-[3/4] rounded-2xl mb-5 !border border-slate-100 bg-white mx-auto" label={`Poster ${label}`} />
                            <span className="font-semibold uppercase text-slate-800 tracking-widest pb-2 mt-auto">
                                <EditableText id={`pillar_txt_${i}`} defaultText={label} />
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            
            <NextTabButton />
        </div>
    );
}

function BrandIdentityView({ brand }: { brand: any }) {
    const { content, isEditMode, updateContent } = useContext(CultureContext);
    const order = content.brand_order ? [...content.brand_order] : ['hero', 'adn'];
    
    const move = (dir: number, id: string) => {
        const idx = order.indexOf(id);
        if (dir === -1 && idx > 0) { const a=[...order]; a[idx]=a[idx-1]; a[idx-1]=id; updateContent('brand_order', a); }
        if (dir === 1 && idx < order.length - 1) { const a=[...order]; a[idx]=a[idx+1]; a[idx+1]=id; updateContent('brand_order', a); }
    }

    const blocks: any = {
        hero: (
            <div key="hero" className="relative group/sort">
                {isEditMode && <div className="absolute top-2 left-2 z-50 flex gap-1 opacity-0 group-hover/sort:opacity-100"><button onClick={()=>move(-1,'hero')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↑ Lên</button><button onClick={()=>move(1,'hero')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↓ Xuống</button></div>}
                <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: brand.teal }}>
                    <EditableImage id="img_brand_hero" className="aspect-[21/9] w-full !border-none !rounded-none opacity-40 mix-blend-overlay" label="Ảnh nền đội ngũ" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white z-10 pointer-events-none">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-wide mb-4 inline-block pointer-events-auto">
                            <EditableText id="brand_hero_title" defaultText="CHÚNG TA CÓ THỂ" />
                        </h2>
                        <p className="text-xl md:text-2xl font-light tracking-wide text-slate-200 inline-block pointer-events-auto">
                            <EditableText id="brand_hero_sub" defaultText="Vươn lên và vượt qua mọi thách thức" className="!w-[300px]" />
                        </p>
                    </div>
                </div>
            </div>
        ),
        adn: (
            <div key="adn" className="relative group/sort w-full text-slate-800">
                {isEditMode && <div className="absolute top-4 right-4 z-50 flex gap-1 opacity-0 group-hover/sort:opacity-100"><button onClick={()=>move(-1,'adn')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↑ Lên</button><button onClick={()=>move(1,'adn')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↓ Xuống</button></div>}
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight uppercase"><EditableText id="adn_main_title" defaultText="ADN LYHU – Sức mạnh của 4 chữ cái" /></h1>
                    <div className="h-1 w-16 mt-4 mb-10" style={{ backgroundColor: brand.teal }}></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {[
                        { l: "L", color: brand.teal, textDefault: "LOVE", sub: "Yêu thương công việc", desc: "Định hình lại các tiêu chuẩn và tạo ra những chuẩn mực mới bằng tình yêu và niềm đam mê công việc." },
                        { l: "Y", color: brand.green, textDefault: "YEARN", sub: "Mong đợi thành công lớn", desc: "Luôn khao khát và nỗ lực để kiến tạo nên những giá trị vật chất và tinh thần vượt xa mong đợi." },
                        { l: "H", color: brand.green, textDefault: "HARMONIZE", sub: "Hòa hợp trong tập thể", desc: "Sức mạnh của tập thể luôn lớn hơn cá nhân. Sự gắn kết đồng thuận tạo nên động lực bức phá." },
                        { l: "U", color: brand.teal, textDefault: "UNIFY", sub: "Thống nhất cùng mục tiêu", desc: "Cùng chung một tầm nhìn, đồng lòng hướng tới một tương lai thịnh vượng, mang tên LYHU." },
                    ].map((item, i) => (
                        <div key={i} className="group">
                            <div className="flex items-center gap-6 mb-4">
                                <div className="text-6xl font-bold" style={{ color: item.color }}>{item.l}</div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-3xl tracking-widest uppercase">
                                        <EditableText id={`adn_title_${i}`} defaultText={item.textDefault} />
                                    </h4>
                                    <p className="text-slate-500 font-medium tracking-wide text-sm mt-1">
                                        <EditableText id={`adn_sub_${i}`} defaultText={item.sub} />
                                    </p>
                                </div>
                            </div>
                            <EditableImage id={`img_adn_${i}`} className="aspect-[3/2] w-full mb-4" label={`Poster ${item.textDefault}`} />
                            <p className="text-slate-600 text-lg leading-relaxed">
                                <EditableText id={`adn_desc_${i}`} multiline defaultText={item.desc} />
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            {order.map((id: string) => blocks[id])}
            <NextTabButton />
        </div>
    );
}

function LogoView({ brand }: { brand: any }) {
    const { content, isEditMode, updateContent } = useContext(CultureContext);
    
    // Ensure 'structure' is part of the order array even if saved context lacks it
    let savedOrder = content.logo_order ? [...content.logo_order] : ['meaning', 'structure', 'colors', 'num4'];
    if (!savedOrder.includes('structure')) savedOrder.splice(1, 0, 'structure');
    
    const order = savedOrder;
    
    const move = (dir: number, id: string) => {
        const idx = order.indexOf(id);
        if (dir === -1 && idx > 0) { const a=[...order]; a[idx]=a[idx-1]; a[idx-1]=id; updateContent('logo_order', a); }
        if (dir === 1 && idx < order.length - 1) { const a=[...order]; a[idx]=a[idx+1]; a[idx+1]=id; updateContent('logo_order', a); }
    }

    const blocks: any = {
        meaning: (
            <div key="meaning" className="relative group/sort w-full text-slate-800">
                {isEditMode && <div className="absolute top-4 right-4 z-50 flex gap-1 opacity-0 group-hover/sort:opacity-100"><button onClick={()=>move(-1,'meaning')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↑ Lên</button><button onClick={()=>move(1,'meaning')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↓ Xuống</button></div>}
                <h2 className="text-3xl font-bold text-slate-800 mb-10 tracking-tight uppercase"><EditableText id="logo_meaning_title" defaultText="Ý TƯỞNG THIẾT KẾ & Ý NGHĨA LOGO" /></h2>
                <div className="h-1 w-16 mb-10 mt-[-10px]" style={{ backgroundColor: brand.teal }}></div>
                <div className="flex flex-col xl:flex-row gap-12 items-center">
                    <div className="w-full xl:w-5/12">
                        <EditableImage id="img_brand_logo_meaning" className="aspect-[4/3] w-full p-4 md:p-8 bg-slate-50/50 rounded-2xl" label="Hình khối Logo" />
                    </div>
                    <div className="w-full xl:w-7/12 space-y-5">
                        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                            <EditableText id="logo_title" defaultText="Biểu Tượng Cho Sự Hòa Hợp" />
                        </h3>
                        <div className="h-1 w-16 rounded" style={{ backgroundColor: brand.teal }}></div>
                        <p className="text-slate-600 text-lg leading-relaxed">
                            <EditableText id="logo_desc_1" multiline defaultText="Logo LYHU là sự kết hợp tinh tế giữa đường nét hiện đại và kết cấu vững chãi. Thiết kế không chỉ thể hiện tên thương hiệu mà còn ẩn chứa khát vọng kiến tạo một hệ sinh thái tuần hoàn và phát triển bền vững." />
                        </p>
                        <p className="text-slate-600 text-lg leading-relaxed">
                            <EditableText id="logo_desc_2" multiline defaultText="Sự liên kết tiếp nối giữa các khối màu đại diện cho sự cộng hưởng của các thành viên cùng chung một mục đích, tượng trưng cho thông điệp cốt lõi: Kết nối chân thành - Hợp tác bền vững." />
                        </p>
                    </div>
                </div>
            </div>
        ),
        structure: (
            <div key="structure" className="relative group/sort w-full text-slate-800">
                {isEditMode && <div className="absolute top-4 right-4 z-50 flex gap-1 opacity-0 group-hover/sort:opacity-100"><button onClick={()=>move(-1,'structure')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↑ Lên</button><button onClick={()=>move(1,'structure')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↓ Xuống</button></div>}
                
                <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight uppercase text-center"><EditableText id="logo_structure_title" defaultText="Tiêu Chuẩn Lưới Cấu Trúc & Tỷ Lệ Vàng" /></h2>
                <p className="text-xl text-slate-500 font-medium text-center mb-10 max-w-3xl mx-auto">
                    <EditableText id="logo_structure_intro" multiline defaultText="Thiết kế logo LYHU dựa trên hệ thống lưới (Grid System) chuẩn mực, đảm bảo tỷ lệ vàng và tính cân bằng tuyệt đối trong khả năng nhận diện." />
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight uppercase border-b border-slate-100 pb-2"><EditableText id="logo_structure_sub1" defaultText="Logo Có Chữ Kèm Biểu Tượng" /></h3>
                        <div className="bg-slate-50/50 rounded-2xl p-6 flex-1 flex items-center justify-center relative">
                            <EditableImage id="img_logo_full" className="w-full aspect-[2/1] mix-blend-multiply opacity-90" label="Logo đầy đủ (Lockup)" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight uppercase border-b border-slate-100 pb-2"><EditableText id="logo_structure_sub2" defaultText="Bản Vẽ Lưới Sinh Tự Động" /></h3>
                        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex-1 relative shadow-inner min-h-[300px] md:min-h-[400px]">
                            {content.img_logo_full ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Base Drafting Paper Grid */}
                                    <div className="absolute inset-0 opacity-[0.15] z-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`, backgroundSize: `12px 12px`, backgroundPosition: `center center` }}></div>
                                    <div className="absolute inset-0 opacity-30 z-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(#db2777 1px, transparent 1px), linear-gradient(90deg, #db2777 1px, transparent 1px)`, backgroundSize: `60px 60px`, backgroundPosition: `center center` }}></div>

                                    {/* Uploaded Logo (Watermark mode) */}
                                    <img src={content.img_logo_full} className="absolute inset-0 w-full h-full object-contain filter grayscale opacity-40 z-10 p-8 pointer-events-none" alt="Base Logo" />

                                    {/* Dynamic Geometry Overlay */}
                                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
                                        {/* Center Construction Axes */}
                                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-pink-500 opacity-60"></div>
                                        <div className="absolute left-0 right-0 top-1/2 h-px bg-pink-500 opacity-60"></div>
                                        <div className="absolute top-1/4 bottom-1/4 left-1/4 w-px bg-pink-500 opacity-30 border-l border-dashed"></div>
                                        <div className="absolute top-1/4 bottom-1/4 right-1/4 w-px bg-pink-500 opacity-30 border-l border-dashed"></div>

                                        {/* Bounding Box with Diagonal Alignments */}
                                        <div className="w-[65%] h-[55%] border border-pink-500 opacity-50 absolute flex items-center justify-center">
                                            <svg className="w-full h-full absolute inset-0 opacity-40" preserveAspectRatio="none">
                                                <line x1="0" y1="0" x2="100%" y2="100%" stroke="#db2777" strokeWidth="1" strokeDasharray="4 4" />
                                                <line x1="100%" y1="0" x2="0" y2="100%" stroke="#db2777" strokeWidth="1" strokeDasharray="4 4" />
                                            </svg>
                                        </div>

                                        {/* Fibonacci / Golden Ratio Circles */}
                                        <div className="w-[50%] aspect-square border border-pink-500 rounded-full opacity-60 absolute mix-blend-multiply flex items-center justify-center">
                                            <div className="w-[61.8%] aspect-square border border-pink-500 rounded-full opacity-70 absolute mix-blend-multiply -translate-x-[20%] translate-y-[20%]"></div>
                                            <div className="w-[38.2%] aspect-square border-2 border-pink-400 rounded-full opacity-80 absolute mix-blend-multiply translate-x-[40%] -translate-y-[40%]"></div>
                                        </div>

                                        {/* Tech Annotations */}
                                        <div className="absolute top-[20%] left-[15%] text-[10px] text-pink-600 font-mono tracking-widest opacity-80 bg-white/50 px-1 rounded">R = 1.618X</div>
                                        <div className="absolute bottom-[20%] right-[15%] text-[10px] text-pink-600 font-mono tracking-widest opacity-80 bg-white/50 px-1 rounded">ø = X</div>
                                        <div className="absolute top-1/2 mt-2 ml-2 left-1/2 text-[10px] text-pink-600 font-mono tracking-widest opacity-80">CENTER (0,0)</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50">
                                    <div className="w-16 h-16 mb-4 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                                        <span className="text-slate-300 transform rotate-45 text-2xl">+</span>
                                    </div>
                                    <p className="text-sm">Vui lòng tải ảnh logo đầy đủ (định dạng PNG trong suốt) ở bên trái để tự động sinh bản vẽ lưới <strong>Tỷ Lệ Vàng</strong>.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ),
        colors: (
            <div key="colors" className="relative group/sort w-full text-slate-800">
                {isEditMode && <div className="absolute top-4 right-4 z-50 flex gap-1 opacity-0 group-hover/sort:opacity-100"><button onClick={()=>move(-1,'colors')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↑ Lên</button><button onClick={()=>move(1,'colors')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↓ Xuống</button></div>}
                <h2 className="text-2xl font-bold text-slate-800 mb-6 uppercase tracking-wide text-center"><EditableText id="logo_color_title" defaultText="Ý Nghĩa Gam Màu Thương Hiệu" /></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 p-2">
                        <div className="w-24 shrink-0 rounded-xl flex items-center justify-center text-white text-xs font-mono font-bold shadow-sm" style={{ backgroundColor: brand.teal }}>#04ACA9</div>
                        <div className="pl-6 py-4 flex-1">
                            <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-2"><EditableText id="color1_t" defaultText="Thanh Lịch & Uy Tín" /></h3>
                            <p className="text-slate-600 text-sm leading-relaxed"><EditableText id="color1_d" multiline defaultText="Xanh ngọc - Biểu trưng cho sự hiện đại, chân thành, sâu sắc và độ tin cậy tuyệt đối." /></p>
                        </div>
                    </div>
                    <div className="flex bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 p-2">
                        <div className="w-24 shrink-0 rounded-xl flex items-center justify-center text-white text-xs font-mono font-bold shadow-sm" style={{ backgroundColor: brand.green }}>#8FC842</div>
                        <div className="pl-6 py-4 flex-1">
                            <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-2"><EditableText id="color2_t" defaultText="Tươi Mới & Vững Bền" /></h3>
                            <p className="text-slate-600 text-sm leading-relaxed"><EditableText id="color2_d" multiline defaultText="Xanh lá - Mang năng lượng của sự sinh trưởng, bền vững, thân thiện và không ngừng phát triển." /></p>
                        </div>
                    </div>
                </div>
            </div>
        ),
        num4: (
            <div key="num4" className="relative group/sort w-full text-slate-800">
                {isEditMode && <div className="absolute top-4 right-4 z-50 flex gap-1 opacity-0 group-hover/sort:opacity-100"><button onClick={()=>move(-1,'num4')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↑ Lên</button><button onClick={()=>move(1,'num4')} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">↓ Xuống</button></div>}
                <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight uppercase text-center"><EditableText id="logo_num4_title" defaultText="ADN LYHU – Sức mạnh của số 4" /></h2>
                <p className="text-xl text-slate-500 font-medium text-center mb-10 max-w-3xl mx-auto">
                    <EditableText id="logo_num4_intro" multiline defaultText="Với LYHU, số 4 không chỉ là một con số. Nó chính là linh hồn của văn hóa doanh nghiệp." />
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { n: 1, title: '4 Cánh nối tiếp nhau', desc: 'Logo của LYHU có 4 cánh, biểu tượng cho sức mạnh của tinh thần đoàn kết, gắn bó bền chặt.', icon: HeartHandshake },
                        { n: 2, title: '4 Ký tự tên công ty', desc: 'Mỗi chữ cái là một giá trị cốt lõi: Love (Yêu thương), Yearn (Khao khát), Harmonize (Hòa hợp), Unify (Thống nhất).', icon: Shapes },
                        { n: 3, title: '4 Nguyên tắc cốt lõi', desc: 'Văn hóa LYHU tôn vinh 4 nguyên tắc: Kỷ luật – Kiên trì – Kiên nhẫn – Chấp nhận quá trình.', icon: CheckCircle2 },
                        { n: 4, title: 'Slogan có vần điệu', desc: 'Slogan của LYHU có 2 vế, mỗi vế chứa trọn 4 từ đắt giá: "Kết nối chân thành – Hợp tác bền vững".', icon: Quote },
                    ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                        <div key={idx} className="bg-slate-50/50 p-6 rounded-2xl flex gap-6 hover:shadow-sm transition-shadow group">
                            <div className="w-16 h-16 shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-105" style={{ color: brand.teal }}>
                                <Icon className="w-8 h-8 stroke-[1.5]" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xl font-bold text-slate-800 mb-2">
                                    <EditableText id={`logo_num4_t_${idx}`} defaultText={item.title} />
                                </h4>
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    <EditableText id={`logo_num4_d_${idx}`} multiline defaultText={item.desc} />
                                </p>
                            </div>
                        </div>
                    )})}
                </div>

                <div className="mt-12 text-white p-8 md:p-12 rounded-2xl relative overflow-hidden shadow-sm" style={{ backgroundColor: brand.teal }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

                    <div className="relative z-10 space-y-6 text-lg tracking-wide font-light">
                        <p className="italic text-white font-medium pb-2 border-b border-white/10">
                            <EditableText id="logo_quote_0" multiline defaultText="Trong thế giới quanh ta, số 4 xuất hiện ở khắp nơi. Bốn mùa luân chuyển – Xuân, Hạ, Thu, Đông. Bốn phương định hướng – Đông, Tây, Nam, Bắc. Bốn yếu tố tự nhiên – Đất, Nước, Lửa, Khí. Tất cả tạo nên một vòng tròn cân bằng, đầy đủ và vững chãi." />
                        </p>
                        <p>
                            <EditableText id="logo_quote_1" multiline defaultText="Số 4 vì thế trở thành ADN của LYHU – một lời nhắc nhở rằng, chỉ khi có nền tảng vững chắc, sự cân bằng toàn diện, kỷ luật và sự đoàn kết, chúng ta mới có thể phát triển lâu dài." />
                        </p>
                        <p>
                            <EditableText id="logo_quote_2" multiline defaultText="Văn hóa doanh nghiệp LYHU được xây trên tinh thần ấy: giản dị mà bền chặt, chân thành mà vững vàng. Để mỗi nhân sự, khi khoác lên mình màu áo xanh ngọc, đều hiểu rằng mình đang đứng trên một nền tảng 4 trụ cột vững vàng, cùng hướng tới tương lai." />
                        </p>
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
            <div className="space-y-10">
                {order.map((id: string) => blocks[id])}
            </div>
            <NextTabButton />
        </div>
    );
}

function CoreValuesView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <div className="w-full text-slate-800">
                <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 w-full">
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight uppercase"><EditableText id="core_main_title" defaultText="Giá Trị Cốt Lõi 3K1C" /></h1>
                        <div className="h-1 w-16 mt-4 mb-6" style={{ backgroundColor: brand.teal }}></div>
                        <div className="text-slate-600 text-xl leading-relaxed font-light">
                            <EditableText id="core_desc" multiline defaultText="3K1C không chỉ là nguyên tắc làm việc, mà còn là thái độ sống, giúp mỗi thành viên LYHU cùng nhau trưởng thành, gắn kết và kiến tạo giá trị lâu dài." />
                        </div>
                    </div>
                    <div className="w-full md:w-[350px] shrink-0">
                        <EditableImage id="img_core_banner" className="aspect-[3/4]" label="Poster 3K1C Biểu tượng" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { title: "KỶ LUẬT", sub: "KỶ LUẬT LÀ HÀNH VI", desc: "Là nền móng để mọi người làm đúng nguyên tắc, quy chuẩn, và giữ sự ổn định trong hành động.", color: brand.teal },
                    { title: "KIÊN TRÌ", sub: "KIÊN TRÌ LÀ THÓI QUEN", desc: "Sau khi có kỷ luật, chúng ta mới duy trì được hành động đều đặn và không bỏ cuộc khi gặp khó khăn.", color: brand.green },
                    { title: "KIÊN NHẪN", sub: "KIÊN NHẪN LÀ THÁI ĐỘ", desc: "Là thái độ chấp nhận nhịp độ và thời gian cần thiết để thấy kết quả. Giúp chúng ta tránh nóng vội.", color: brand.teal },
                    { title: "CHẤP NHẬN", sub: "CHẤP NHẬN QUÁ TRÌNH LÀ TƯ DUY", desc: "Tư duy cao nhất: hiểu rằng kết quả đến từ hành trình. Giúp chúng ta gắn bó lâu dài đối mặt với thăng trầm.", color: brand.green }
                ].map((item, idx) => (
                    <div key={idx} className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -top-6 -right-6 text-9xl font-bold opacity-5 transition-transform group-hover:scale-110" style={{ color: item.color }}>{idx + 1}</div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-bold uppercase tracking-tight mb-2" style={{ color: item.color }}><EditableText id={`core_t_${idx}`} defaultText={item.title} /></h3>
                            <h4 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-6"><EditableText id={`core_s_${idx}`} defaultText={item.sub} className="!w-full" /></h4>
                            <div className="text-slate-600 leading-relaxed text-lg"><EditableText id={`core_d_${idx}`} multiline defaultText={item.desc} /></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 relative bg-white p-10 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Quote className="w-24 h-24" style={{ color: brand.teal }} /></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-[300px] shrink-0">
                        <EditableImage id="img_core_quote" className="aspect-square !bg-slate-50" label="Đồ họa trích dẫn" />
                    </div>
                    <div className="flex-1 w-full">
                        <div className="italic font-light tracking-wide text-slate-700 text-2xl leading-relaxed mb-6">
                            <EditableText id="quote1_txt" multiline defaultText="Chọn đúng thời gian, sự bền bỉ và mười năm nỗ lực rồi cuối cùng sẽ khiến bạn có vẻ như thành công chỉ trong một đêm." />
                        </div>
                        <p className="font-bold text-slate-900 tracking-wide uppercase">— <EditableText id="quote1_author" defaultText="BIZ STONE (Đồng sáng lập Twitter)" /></p>
                    </div>
                </div>
            </div>
            <NextTabButton />
        </div>
    );
}

function PhilosophyView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <div className="w-full text-slate-800">
                <div className="text-center mb-12">
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight uppercase"><EditableText id="phil_main_title" defaultText="Triết Lý Làm Việc Của Chúng Ta" /></h1>
                    <div className="h-1 w-16 mx-auto mt-4" style={{ backgroundColor: brand.teal }}></div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-16 max-w-2xl mx-auto">
                    <div className="text-center">
                        <EditableImage id="img_phil1" className="aspect-square max-w-[200px] mx-auto !rounded-full !border-0 bg-slate-50" label="Icon Chân thành" />
                        <h3 className="mt-6 text-2xl font-bold uppercase tracking-wide" style={{ color: brand.teal }}>KẾT NỐI CHÂN THÀNH</h3>
                    </div>
                    <div className="text-center">
                        <EditableImage id="img_phil2" className="aspect-square max-w-[200px] mx-auto !rounded-full !border-0 bg-slate-50" label="Icon Hợp tác" />
                        <h3 className="mt-6 text-2xl font-bold uppercase tracking-wide" style={{ color: brand.green }}>HỢP TÁC BỀN VỮNG</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4 uppercase tracking-wide">Tại LYHU,</h3>
                        <div className="text-slate-600 text-lg leading-loose"><EditableText id="phil1_d" multiline defaultText="Chúng tôi tin rằng mọi mối quan hệ đều bắt đầu từ sự chân thành. Từ người lao động cho đến đối tác và khách hàng, chúng tôi tạo ra một môi trường làm việc nơi mọi ý kiến đều được trân trọng." /></div>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4 uppercase tracking-wide">Giá trị Lâu dài</h3>
                        <div className="text-slate-600 text-lg leading-loose"><EditableText id="phil2_d" multiline defaultText="Chúng tôi chú trọng sự bền vững. Trong quá trình làm việc, chúng tôi hướng đến sự công bằng, minh bạch và tin cậy. Hợp tác là sự gắn kết để cùng phát triển." /></div>
                    </div>
                </div>

                <div className="mt-12 p-8 rounded-2xl text-center relative overflow-hidden" style={{ backgroundColor: brand.teal, color: 'white' }}>
                    <div className="text-xl md:text-2xl font-light leading-relaxed relative z-10 max-w-4xl mx-auto">
                        <EditableText id="phil3_d" multiline defaultText="Chúng tôi tin rằng giá trị Kết Nối Chân Thành – Hợp Tác Bền Vững không chỉ là khẩu hiệu, mà là cách chúng tôi chọn để làm việc và sống cùng nhau. Ở LYHU, mỗi sản phẩm đều gắn với sự sẻ chia." />
                    </div>
                </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: brand.teal }}>
                <EditableImage id="img_phil_team" className="aspect-[21/9] !border-none w-full !rounded-none opacity-50 mix-blend-overlay" label="Ảnh team LYHU" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white z-10 pointer-events-none">
                    <div className="text-2xl md:text-3xl italic mb-6 leading-relaxed max-w-4xl inline-block pointer-events-auto">
                        <EditableText id="quote2_txt" multiline defaultText="Đoàn kết không chỉ là đứng cạnh nhau, mà là cùng nhìn về một hướng." />
                    </div>
                    <p className="text-lg font-bold tracking-widest uppercase inline-block pointer-events-auto">— <EditableText id="quote2_author" defaultText="Antoine de Saint-Exupéry" /></p>
                </div>
            </div>
            <NextTabButton />
        </div>
    );
}

function VisionView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <div className="w-full text-slate-800">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight uppercase"><EditableText id="vis_main_title" defaultText="Chúng Ta Hướng Về Đâu?" /></h1>
                    <div className="h-1 w-16 mt-4 mb-10" style={{ backgroundColor: brand.teal }}></div>
                </div>

                <div className="space-y-12">
                    <div className="flex flex-col lg:flex-row gap-8 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="w-full lg:w-1/2 shrink-0">
                            <EditableImage id="img_vis1" className="aspect-video w-full" label="Bản đồ 7 khu vực" />
                        </div>
                        <div className="flex-1 w-full">
                            <h3 className="text-2xl font-bold text-slate-800 tracking-wide mb-4" style={{ color: brand.green }}><EditableText id="vis1_t" defaultText="HỆ THỐNG GT TOÀN QUỐC" /></h3>
                            <div className="text-slate-600 text-lg leading-relaxed mb-4"><EditableText id="vis1_d" multiline defaultText="Phủ sóng độ nhận diện và hoạt động xuyên suốt đất nước." /></div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-700 font-medium text-sm">
                                <div>• Đồng bằng sông Hồng</div>
                                <div>• Đồng bằng sông Cửu Long</div>
                                <div>• Trung du & Miền núi phía Bắc</div>
                                <div>• Bắc Trung Bộ</div>
                                <div>• Duyên hải Nam Trung Bộ</div>
                                <div>• Tây Nguyên</div>
                                <div>• Đông Nam Bộ</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col h-full">
                            <h3 className="text-xl font-bold text-slate-800 uppercase mb-4 tracking-wide" style={{ color: brand.teal }}><EditableText id="vis2_t" defaultText="Chuỗi Hệ thống Siêu thị" /></h3>
                            <EditableImage id="img_vis2" className="aspect-video mb-4 w-full flex-1" label="Ảnh Winmart/GO/Tops" />
                            <div className="text-slate-600 mt-4 leading-relaxed"><EditableText id="vis2_d" multiline defaultText="Trở thành nhà cung cấp/đối tác chiến lược uy tín trong hệ thống đại siêu thị tiêu dùng toàn quốc." /></div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col h-full">
                            <h3 className="text-xl font-bold text-slate-800 uppercase mb-4 tracking-wide" style={{ color: brand.green }}><EditableText id="vis3_t" defaultText="Cửa Hàng Tiện Lợi" /></h3>
                            <EditableImage id="img_vis3" className="aspect-video mb-4 w-full flex-1" label="Ảnh CircleK/GS25" />
                            <div className="text-slate-600 mt-4 leading-relaxed"><EditableText id="vis3_d" multiline defaultText="Đưa sản phẩm phủ rợp khắp chuỗi cửa hàng tiện lợi phục vụ trực tiếp giới trẻ và dân văn phòng." /></div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 uppercase mb-6 tracking-wide text-center" style={{ color: brand.teal }}>Năng Lực Cung Ứng & Vận Hành Toàn Diện</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <EditableImage id="img_vis4" className="aspect-[3/4] w-full" label="Ảnh Chuỗi cửa hàng riêng" />
                            <EditableImage id="img_vis5" className="aspect-[3/4] w-full" label="Ảnh Logistics/Tàu Container" />
                            <EditableImage id="img_vis6" className="aspect-[3/4] w-full" label="Ảnh Nhà máy/Hạ tầng" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: brand.teal }}>
                <EditableImage id="img_vis_final" className="aspect-[21/9] !border-none !rounded-none w-full opacity-40 mix-blend-overlay" label="Ảnh leo núi" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-16 text-center text-white z-10 pointer-events-none">
                    <div className="text-xl md:text-4xl italic mb-8 max-w-4xl leading-relaxed inline-block pointer-events-auto font-light">
                        <EditableText id="quote3_txt" multiline defaultText="Tập hợp cùng nhau là điểm bắt đầu. Gắn bó cùng nhau là tiến triển. Làm việc cùng nhau là thành công." />
                    </div>
                    <p className="text-xl font-bold tracking-wide text-slate-300 inline-block pointer-events-auto">— <EditableText id="quote3_author" defaultText="Henry Ford" /></p>
                </div>
            </div>

            <div className="text-center pt-8 pb-12">
                <h2 className="text-3xl font-bold tracking-wide" style={{ color: brand.teal }}>WELCOME TO LYHU</h2>
                <p className="mt-4 text-xl text-slate-500 font-light">Chúc bạn một ngày làm việc vui vẻ và hiệu quả!</p>
            </div>
        </div>
    );
}

function BrandsView({ brand }: { brand: any }) {
    const { isEditMode } = useContext(CultureContext);
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <div className="w-full text-slate-800">
                <div className="text-center mb-12">
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight uppercase"><EditableText id="brands_main_title" defaultText="Danh Mục Nhãn Hàng & Sản Phẩm" /></h1>
                    <div className="h-1 w-16 mx-auto mt-4" style={{ backgroundColor: brand.teal }}></div>
                    <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto font-light">
                        <EditableText id="brands_intro_desc" multiline defaultText="Hệ sinh thái sản phẩm phong phú và chất lượng, phục vụ cho nhiều nhu cầu khác nhau của thị trường." />
                    </p>
                </div>
                
                {/* Lĩnh Vực Hoạt Động */}
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-10">
                         <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                             <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                         </div>
                         <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Lĩnh Vực Hoạt Động</h2>
                         <div className="flex-1 h-px bg-slate-200"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "Sản xuất", color: brand.teal, icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
                            { name: "Nhập khẩu", color: brand.green, icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z m4 -4l4 4m0 0l4-4m-4 4V7" },
                            { name: "Bán lẻ", color: brand.green, icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
                            { name: "Thương mại", color: brand.teal, icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-sm hover:border-teal-300 transition-all group flex flex-col items-start gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d={item.icon} /></svg>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 mb-1 tracking-widest uppercase">0{idx + 1}</div>
                                    <div className="font-semibold text-slate-800 tracking-wide text-lg group-hover:text-teal-700 transition-colors">
                                        <EditableText id={`brand_lv_${idx}`} defaultText={item.name} />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2 leading-relaxed"><EditableText id={`brand_lv_desc_${idx}`} defaultText="Nền tảng vững chắc trong chuỗi cung ứng." /></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nhãn Hàng */}
                <div>
                     <div className="flex items-center gap-4 mb-10">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                             <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                         </div>
                         <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Hệ Thống Nhãn Hàng</h2>
                         <div className="flex-1 h-px bg-slate-200"></div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {[
                             { name: "BOYO", desc: "Thương hiệu riêng" },
                             { name: "CVT", desc: "Nhập khẩu (Trung Quốc)" },
                             { name: "ABI SNACK", desc: "Phân phối độc quyền (Việt Nam)" },
                             { name: "UHi", desc: "Nhập khẩu (Hàn Quốc)" },
                         ].map((l, i) => (
                             <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-sm hover:border-slate-300 transition-all duration-300 transform flex flex-col">
                                 {/* Header Info */}
                                 <div className="p-8 flex flex-col md:flex-row gap-6 items-center md:items-start border-b border-slate-100">
                                     <div className="w-32 h-32 md:w-24 md:h-24 bg-slate-50 rounded-2xl border border-slate-100 shrink-0 flex items-center justify-center overflow-hidden p-2">
                                         <EditableImage id={`logo_brand_${i}`} className="w-full h-full object-contain !border-none !rounded-none !aspect-auto" label={`Logo ${l.name}`} />
                                     </div>
                                     <div className="text-center md:text-left flex-1">
                                        <h3 className="font-semibold text-2xl tracking-widest uppercase text-slate-900 mb-1"><EditableText id={`name_brand_${i}`} defaultText={l.name} /></h3>
                                        <p className="font-semibold text-sm uppercase tracking-wider mb-3" style={{ color: brand.teal }}><EditableText id={`desc_brand_${i}`} defaultText={l.desc} /></p>
                                        <p className="text-slate-500 text-sm leading-relaxed"><EditableText id={`brand_intro_long_${i}`} multiline defaultText="Sản phẩm chất lượng cao, cung ứng trực tiếp đến người tiêu dùng nội địa." /></p>
                                        <div className={`mt-4 ${isEditMode ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}`}>
                                            <EditableLink id={`brand_link_web_${i}`} icon={Globe} label="Website" />
                                            <EditableLink id={`brand_link_fb_${i}`} icon={Facebook} label="Fanpage" />
                                            <EditableLink id={`brand_link_tt_${i}`} icon={Video} label="TikTok" />
                                            <EditableLink id={`brand_link_sp_${i}`} icon={ShoppingBag} label="Shopee" />
                                            <EditableLink id={`brand_link_yt_${i}`} icon={Youtube} label="Youtube" />
                                            <EditableLink id={`brand_link_ig_${i}`} icon={Instagram} label="Instagram" />
                                            <EditableLink id={`brand_link_th_${i}`} icon={AtSign} label="Threads" />
                                        </div>
                                     </div>
                                 </div>
                                 
                                 {/* Images Area */}
                                 <div className="p-6 bg-slate-50 flex-1">
                                    <div className="flex items-center gap-2 mb-4 px-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <h4 className="font-bold text-xs text-slate-400 tracking-wide">Sản Phẩm Tiêu Biểu</h4>
                                    </div>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="relative group/img">
                                            <EditableImage id={`img_brand_prod_${i}_1`} className="aspect-square w-full rounded-2xl shadow-sm border border-slate-100 bg-white object-cover group-hover/img:shadow-sm transition-shadow" label={`Sản phẩm ${l.name} 1`} />
                                         </div>
                                         <div className="relative group/img">
                                            <EditableImage id={`img_brand_prod_${i}_2`} className="aspect-square w-full rounded-2xl shadow-sm border border-slate-100 bg-white object-cover group-hover/img:shadow-sm transition-shadow" label={`Sản phẩm ${l.name} 2`} />
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
            <NextTabButton />
        </div>
    );
}
