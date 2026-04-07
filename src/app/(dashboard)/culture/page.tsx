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
    Shapes
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

// --- CONTEXT CHO CMS ---
const CultureContext = createContext<any>(null);

function EditableText({ id, defaultText, className = "", multiline = false }: { id: string, defaultText: string | React.ReactNode, className?: string, multiline?: boolean }) {
    const { content, isEditMode, updateContent } = useContext(CultureContext);
    const val = content[id] !== undefined ? content[id] : defaultText;

    if (!isEditMode) return <span className={className}>{val}</span>;

    if (multiline) {
        return <textarea 
            className={`w-full p-3 border-2 border-teal-400 bg-teal-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[120px] transition-all resize-none shadow-sm ${className}`} 
            value={val} 
            onChange={e => updateContent(id, e.target.value)} 
            placeholder="Nhập nội dung..."
        />
    }
    return <input 
        type="text" 
        className={`w-full p-2 border-2 border-teal-400 bg-teal-50/50 rounded-lg focus:outline-none shadow-sm transition-all ${className}`} 
        value={val} 
        onChange={e => updateContent(id, e.target.value)} 
        placeholder="Nhập nội dung..."
    />
}

function EditableImage({ id, label, className = "aspect-video" }: { id: string, label: string, className?: string }) {
    const { content, isEditMode, updateContent, uploadImage, uploadingId } = useContext(CultureContext);
    const imageUrl = content[id];
    const shape = content[`${id}_shape`];
    const size = content[`${id}_size`];
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

    const finalClasses = `${className} ${dynamicClasses}`.trim();

    if (!isEditMode) {
        if (!imageUrl) return (
            <div className={`w-full flex-col items-center justify-center text-slate-400 outline-none flex bg-slate-100 ${finalClasses}`}>
                <ImageIcon className="w-8 h-8 opacity-50" />
            </div>
        );
        return (
            <div className={`relative overflow-hidden flex items-center justify-center ${finalClasses}`}>
                <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover outline-none" />
            </div>
        );
    }

    return (
        <div className={`relative group overflow-hidden border-2 border-dashed border-teal-400 flex items-center justify-center ${finalClasses}`}>
           {imageUrl ? <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-60" /> : <div className="absolute inset-0 w-full h-full bg-teal-50" />}

           <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm">
               {isUploading ? (
                   <span className="text-white text-sm font-bold flex items-center gap-2">
                       <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> 
                       Đang tải ảnh...
                   </span>
               ) : (
                   <div className="flex flex-col items-center gap-3 w-max p-2">
                       {/* Upload Button */}
                       <label className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-bold flex items-center gap-2 shadow-lg mb-1">
                           <ImageIcon className="w-4 h-4" /> Chọn ảnh mới
                           <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={e => uploadImage(id, e.target.files?.[0])} 
                           />
                       </label>

                       {/* Controls Panel */}
                       <div className="flex flex-col gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700 shadow-xl" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center gap-2 text-xs">
                               <span className="text-slate-300 w-10 font-medium tracking-wide">DÁNG:</span>
                               <button onClick={() => updateContent(`${id}_shape`, 'square')} className={`p-1.5 rounded ${shape==='square'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Vuông">⏹️</button>
                               <button onClick={() => updateContent(`${id}_shape`, 'portrait')} className={`p-1.5 rounded ${shape==='portrait'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Dọc A4">📄</button>
                               <button onClick={() => updateContent(`${id}_shape`, 'video')} className={`p-1.5 rounded ${shape==='video'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Ngang">🖥️</button>
                               <button onClick={() => updateContent(`${id}_shape`, 'cinema')} className={`p-1.5 rounded ${shape==='cinema'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Banner">▭</button>
                               <button onClick={() => updateContent(`${id}_shape`, 'circle')} className={`p-1.5 rounded ${shape==='circle'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Tròn">🔵</button>
                               <button onClick={() => updateContent(`${id}_shape`, '')} className={`p-1.5 rounded font-bold ${!shape?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} title="Mặc định">MĐ</button>
                           </div>
                           <div className="flex items-center gap-2 text-xs">
                               <span className="text-slate-300 w-10 font-medium tracking-wide">CỠ:</span>
                               <button onClick={() => updateContent(`${id}_size`, 'sm')} className={`px-2 py-1 rounded font-bold ${size==='sm'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>S</button>
                               <button onClick={() => updateContent(`${id}_size`, 'md')} className={`px-2 py-1 rounded font-bold ${size==='md'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>M</button>
                               <button onClick={() => updateContent(`${id}_size`, 'lg')} className={`px-2 py-1 rounded font-bold ${size==='lg'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>L</button>
                               <button onClick={() => updateContent(`${id}_size`, 'full')} className={`px-2 py-1 rounded font-bold ${size==='full'?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Full</button>
                               <button onClick={() => updateContent(`${id}_size`, '')} className={`px-2 py-1 rounded font-bold ${!size?'bg-teal-500 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>MĐ</button>
                           </div>
                       </div>
                   </div>
               )}
           </div>
        </div>
    );
}

// --- MAIN PAGE ---
export default function CulturePage() {
    const [activeTab, setActiveTab] = useState('intro');
    const [content, setContent] = useState<Record<string, any>>({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const supabase = createClient();

    // MÀU THƯƠNG HIỆU
    const BRAND = { teal: '#00afa9', green: '#98c93c' };

    const TABS = [
        { id: 'intro', label: "Thông điệp mở đầu", icon: Info },
        { id: 'brand', label: "ADN Thương hiệu", icon: Palette },
        { id: 'logo', label: "Thiết kế & Ý nghĩa Logo", icon: Shapes },
        { id: 'core', label: "Giá trị cốt lõi 3K1C", icon: Scale },
        { id: 'philosophy', label: "Triết lý hành động", icon: HeartHandshake },
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
            alert("Lỗi upload ảnh: " + err.message);
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
            alert("Đã lưu nội dung cực thành công! Các tab khác kể cả Sale/Telesales cũng sẽ thấy nội dung mới nhất.");
            setIsEditMode(false);
        } catch (err: any) {
            alert("Lỗi khi lưu bảng db: " + err.message);
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <DashboardShell title="Văn hóa doanh nghiệp"><div className="p-8 text-center animate-pulse">Đang nạp dữ liệu cẩm nang...</div></DashboardShell>
    }

    return (
        <CultureContext.Provider value={{ content, isEditMode, updateContent, uploadImage, uploadingId }}>
            <DashboardShell title="Văn hóa doanh nghiệp">
                {/* Thanh công cụ Admin */}
                <div className="mb-4 flex items-center justify-end gap-3 px-2">
                    {isEditMode ? (
                        <>
                            <button onClick={() => setIsEditMode(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                                Hủy Sửa
                            </button>
                            <button onClick={saveChanges} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700 transition-colors disabled:opacity-70">
                                <Save className="w-4 h-4" />
                                {isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-700 bg-white border-2 border-dashed border-teal-500 rounded-lg shadow-sm hover:bg-teal-50 transition-colors tooltip" title="Chỉ bật khi muốn thay ảnh, gắn chữ">
                            <Edit3 className="w-4 h-4 text-teal-600" />
                            Sửa Nội Dung In-place
                        </button>
                    )}
                </div>

                <div className="flex h-[calc(100vh-180px)] w-full bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden font-sans relative">
                    {/* LEFT SIDEBAR */}
                    <div className="w-72 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col h-full z-10 hidden md:flex">
                        <div className="p-6 border-b border-slate-200 bg-white shrink-0">
                            <div className="flex items-center gap-2.5 text-slate-800 font-bold uppercase tracking-widest text-[13px]">
                                <BookOpen className="w-5 h-5" style={{ color: BRAND.teal }} />
                                <span>Cẩm Nang Nội Bộ</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                            {TABS.map((tab) => {
                                const isActive = tab.id === activeTab;
                                const Icon = tab.icon;
                                return (
                                    <div 
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`group flex items-center justify-between px-4 py-3.5 rounded-lg cursor-pointer transition-all duration-200 ${
                                            isActive 
                                            ? "bg-white text-slate-900 border border-slate-200 shadow-sm font-semibold" 
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-4 h-4 transition-colors" style={{ color: isActive ? BRAND.teal : '#94a3b8' }} />
                                            <span className="text-[14px]">{tab.label}</span>
                                        </div>
                                        <ArrowRight className={`w-4 h-4 transition-all ${isActive ? 'opacity-100' : 'opacity-0 -translate-x-2'}`} style={{ color: isActive ? BRAND.teal : '' }} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT CONTENT AREA */}
                    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-y-auto scrollbar-thin">
                        <div className="max-w-5xl mx-auto w-full p-6 md:p-10 lg:p-14 pb-24">
                            {activeTab === 'intro' && <IntroductionView brand={BRAND} />}
                            {activeTab === 'brand' && <BrandIdentityView brand={BRAND} />}
                            {activeTab === 'logo' && <LogoView brand={BRAND} />}
                            {activeTab === 'core' && <CoreValuesView brand={BRAND} />}
                            {activeTab === 'philosophy' && <PhilosophyView brand={BRAND} />}
                            {activeTab === 'vision' && <VisionView brand={BRAND} />}
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

function IntroductionView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-12 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 relative">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Thông Điệp Từ Ban Lãnh Đạo</h1>
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

                <div className="w-full lg:w-[400px] shrink-0">
                    <EditableImage id="img_intro_banner" className="aspect-[3/4] w-full" label="Ảnh Lãnh đạo / Tòa nhà LYHU" />
                </div>
            </div>

            <div className="pt-8 w-full border-t border-slate-100 mt-12">
                <h3 className="text-2xl font-black text-slate-800 mb-8 text-center uppercase tracking-widest">4 TRỤ CỘT HOẠT ĐỘNG</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {["Sản xuất", "Nhập khẩu", "Thương mại", "Bán lẻ"].map((label, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-stretch text-center shadow-sm hover:shadow-md transition-shadow">
                            <EditableImage id={`img_pillar_${i}`} className="w-full aspect-[3/4] rounded-2xl mb-5 !border border-slate-200 bg-white mx-auto" label={`Poster ${label}`} />
                            <span className="font-extrabold uppercase text-slate-800 tracking-widest pb-2 mt-auto">
                                <EditableText id={`pillar_txt_${i}`} defaultText={label} />
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function BrandIdentityView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            {/* Slogan Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-primary-900 border border-primary-800">
                <EditableImage id="img_brand_hero" className="aspect-[21/9] w-full !border-none !rounded-none opacity-40 mix-blend-overlay" label="Ảnh nền đội ngũ" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white z-10 pointer-events-none">
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest mb-4 inline-block pointer-events-auto">
                        <EditableText id="brand_hero_title" defaultText="CHÚNG TA CÓ THỂ" />
                    </h2>
                    <p className="text-xl md:text-2xl font-light tracking-wide text-slate-200 inline-block pointer-events-auto">
                        <EditableText id="brand_hero_sub" defaultText="Vươn lên và vượt qua mọi thách thức" className="!w-[300px]" />
                    </p>
                </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">ADN LYHU – Sức mạnh của 4 chữ cái</h1>
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
                                <div className="text-6xl font-black" style={{ color: item.color }}>{item.l}</div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-3xl tracking-widest uppercase">
                                        <EditableText id={`adn_title_${i}`} defaultText={item.textDefault} />
                                    </h4>
                                    <p className="text-slate-500 font-medium uppercase tracking-widest text-sm mt-1">
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

                {/* Ý Nghĩa Màu Sắc */}
                <div className="mt-16 pt-12 border-t border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 uppercase tracking-wide text-center">Ý Nghĩa Gam Màu Thương Hiệu</h2>
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
            </div>
        </div>
    );
}

function LogoView({ brand }: { brand: any }) {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight uppercase">Ý TƯỞNG THIẾT KẾ & Ý NGHĨA LOGO</h2>
                    <div className="h-1 w-16 mb-10 mt-[-10px]" style={{ backgroundColor: brand.teal }}></div>
                    <div className="flex flex-col xl:flex-row gap-12 items-center">
                        <div className="w-full xl:w-5/12">
                            <EditableImage id="img_brand_logo_meaning" className="aspect-[4/3] w-full p-4 md:p-8 bg-slate-50 border border-slate-100 rounded-3xl" label="Hình khối Logo" />
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

                <div className="mt-16 pt-12 border-t border-slate-100">
                    <h2 className="text-3xl font-black text-slate-800 mb-6 tracking-tight uppercase text-center">ADN LYHU – Sức mạnh của số 4</h2>
                    <p className="text-xl text-slate-500 font-medium text-center mb-10 max-w-3xl mx-auto">
                        <EditableText id="logo_num4_intro" multiline defaultText="Với LYHU, số 4 không chỉ là một con số. Nó chính là linh hồn của văn hóa doanh nghiệp." />
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { n: 1, title: '4 Cánh nối tiếp nhau', desc: 'Logo của LYHU có 4 cánh, biểu tượng cho sức mạnh của tinh thần đoàn kết, gắn bó bền chặt.' },
                            { n: 2, title: '4 Ký tự tên công ty', desc: 'Mỗi chữ cái là một giá trị cốt lõi: Love (Yêu thương), Yearn (Khao khát), Harmonize (Hòa hợp), Unify (Thống nhất).' },
                            { n: 3, title: '4 Nguyên tắc cốt lõi', desc: 'Văn hóa LYHU tôn vinh 4 nguyên tắc: Kỷ luật – Kiên trì – Kiên nhẫn – Chấp nhận quá trình.' },
                            { n: 4, title: 'Slogan có vần điệu', desc: 'Slogan của LYHU có 2 vế, mỗi vế chứa trọn 4 từ đắt giá: "Kết nối chân thành – Hợp tác bền vững".' },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex gap-6 hover:shadow-md transition-shadow group">
                                <div className="w-20 shrink-0">
                                    <EditableImage id={`img_logo_num4_${idx}`} className="w-full aspect-square bg-white rounded-xl shadow-sm border border-slate-100 p-2" label={`Icon ${idx+1}`} />
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
                        ))}
                    </div>

                    <div className="mt-12 bg-primary-900 text-white p-8 md:p-12 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

                        <div className="relative z-10 space-y-6 text-lg tracking-wide font-light">
                            <p className="italic text-teal-300 font-medium pb-2 border-b border-white/10">
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
            </div>
        </div>
    );
}

function CoreValuesView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 w-full">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Giá Trị Cốt Lõi 3K1C</h1>
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
                    <div key={idx} className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute -top-6 -right-6 text-9xl font-black opacity-5 transition-transform group-hover:scale-110" style={{ color: item.color }}>{idx + 1}</div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ color: item.color }}><EditableText id={`core_t_${idx}`} defaultText={item.title} /></h3>
                            <h4 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-6"><EditableText id={`core_s_${idx}`} defaultText={item.sub} className="!w-full" /></h4>
                            <div className="text-slate-600 leading-relaxed text-lg"><EditableText id={`core_d_${idx}`} multiline defaultText={item.desc} /></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 relative bg-white p-10 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
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
        </div>
    );
}

function PhilosophyView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Triết Lý Làm Việc Của Chúng Ta</h1>
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

            <div className="relative rounded-3xl overflow-hidden bg-primary-900 border border-primary-800">
                <EditableImage id="img_phil_team" className="aspect-[21/9] !border-none w-full !rounded-none opacity-50 mix-blend-overlay" label="Ảnh team LYHU" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white z-10 pointer-events-none">
                    <div className="text-2xl md:text-3xl italic mb-6 leading-relaxed max-w-4xl inline-block pointer-events-auto">
                        <EditableText id="quote2_txt" multiline defaultText="Đoàn kết không chỉ là đứng cạnh nhau, mà là cùng nhìn về một hướng." />
                    </div>
                    <p className="text-lg font-bold tracking-widest uppercase inline-block pointer-events-auto">— <EditableText id="quote2_author" defaultText="Antoine de Saint-Exupéry" /></p>
                </div>
            </div>
        </div>
    );
}

function VisionView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Chúng Ta Hướng Về Đâu?</h1>
                    <div className="h-1 w-16 mt-4 mb-10" style={{ backgroundColor: brand.teal }}></div>
                </div>

                <div className="space-y-12">
                    <div className="flex flex-col lg:flex-row gap-8 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="w-full lg:w-1/2 shrink-0">
                            <EditableImage id="img_vis1" className="aspect-video w-full" label="Bản đồ 7 khu vực" />
                        </div>
                        <div className="flex-1 w-full">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-4" style={{ color: brand.green }}><EditableText id="vis1_t" defaultText="HỆ THỐNG GT TOÀN QUỐC" /></h3>
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

            <div className="relative rounded-3xl overflow-hidden bg-primary-900 border border-primary-800">
                <EditableImage id="img_vis_final" className="aspect-[21/9] !border-none !rounded-none w-full opacity-40 mix-blend-overlay" label="Ảnh leo núi" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-16 text-center text-white z-10 pointer-events-none">
                    <div className="text-xl md:text-4xl italic mb-8 max-w-4xl leading-relaxed inline-block pointer-events-auto font-light">
                        <EditableText id="quote3_txt" multiline defaultText="Tập hợp cùng nhau là điểm bắt đầu. Gắn bó cùng nhau là tiến triển. Làm việc cùng nhau là thành công." />
                    </div>
                    <p className="text-xl font-bold uppercase tracking-widest text-slate-300 inline-block pointer-events-auto">— <EditableText id="quote3_author" defaultText="Henry Ford" /></p>
                </div>
            </div>

            <div className="text-center pt-8 pb-12">
                <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: brand.teal }}>WELCOME TO LYHU</h2>
                <p className="mt-4 text-xl text-slate-500 font-light">Chúc bạn một ngày làm việc vui vẻ và hiệu quả!</p>
            </div>
        </div>
    );
}
