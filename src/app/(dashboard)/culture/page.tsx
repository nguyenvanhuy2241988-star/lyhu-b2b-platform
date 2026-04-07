"use client";

import React, { useState } from "react";
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
    Quote
} from "lucide-react";

export default function CulturePage() {
    const [activeTab, setActiveTab] = useState('intro');

    // MÀU THƯƠNG HIỆU LYHU TỪ TÀI LIỆU CỐT LÕI
    const BRAND = {
        teal: '#04ACA9',  // Xanh ngọc
        green: '#8FC842'  // Xanh lá
    };

    const TABS = [
        { id: 'intro', label: "Thông điệp mở đầu", icon: Info },
        { id: 'brand', label: "ADN Thương hiệu", icon: Palette },
        { id: 'core', label: "Giá trị cốt lõi 3K1C", icon: Scale },
        { id: 'philosophy', label: "Triết lý hành động", icon: HeartHandshake },
        { id: 'vision', label: "Định hướng tương lai", icon: Map },
    ];

    return (
        <DashboardShell title="Văn hóa doanh nghiệp">
            <div className="flex h-[calc(100vh-140px)] w-full bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden font-sans">
                
                {/* LEFT SIDEBAR (Slider) */}
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
                                        <Icon 
                                            className="w-4 h-4 transition-colors" 
                                            style={{ color: isActive ? BRAND.teal : '#94a3b8' }} 
                                        />
                                        <span className="text-[14px]">{tab.label}</span>
                                    </div>
                                    <ArrowRight className={`w-4 h-4 transition-all ${isActive ? 'opacity-100' : 'opacity-0 -translate-x-2'}`} style={{ color: isActive ? BRAND.teal : '' }} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden absolute top-4 left-4 z-50">
                    <select 
                        value={activeTab} 
                        onChange={(e) => setActiveTab(e.target.value)}
                        className="bg-white border border-slate-200 rounded-md px-4 py-2 text-sm text-slate-700 font-medium focus:outline-none w-[220px]"
                        style={{ borderLeft: `3px solid ${BRAND.teal}` }}
                    >
                        {TABS.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-y-auto scrollbar-thin">
                    <div className="max-w-5xl mx-auto w-full p-6 md:p-10 lg:p-14">
                        {activeTab === 'intro' && <IntroductionView brand={BRAND} />}
                        {activeTab === 'brand' && <BrandIdentityView brand={BRAND} />}
                        {activeTab === 'core' && <CoreValuesView brand={BRAND} />}
                        {activeTab === 'philosophy' && <PhilosophyView brand={BRAND} />}
                        {activeTab === 'vision' && <VisionView brand={BRAND} />}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

/* =========================================
   UI COMPONENTS & IMAGE PLACEHOLDERS
   Hướng dẫn: Thay thế "src" của <img> hoặc dùng class bg-image khi đã có file ảnh thật.
   ========================================= */

function ImagePlaceholder({ className = "aspect-video", label = "Khu vực chèn ảnh" }: { className?: string, label?: string }) {
    return (
        <div className={`w-full bg-slate-200/50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 p-6 ${className}`}>
            <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs opacity-70 mt-1">Sửa code để thay URL ảnh vào đây</span>
        </div>
    );
}

function IntroductionView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-12 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Thông Điệp Từ Ban Lãnh Đạo</h1>
                <div className="h-1 w-16 mt-4" style={{ backgroundColor: brand.teal }}></div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className="flex-1 space-y-6 text-slate-600 text-lg leading-relaxed">
                    <p><strong>Thân gửi toàn thể nhân sự LYHU,</strong></p>
                    <p>
                        Từ những ngày đầu khởi nghiệp, chúng ta đã cùng nhau vượt qua nhiều thử thách. LYHU được xây dựng bằng sự nỗ lực, niềm tin và tinh thần gắn kết của từng thành viên.
                    </p>
                    <p>
                        Chúng tôi tin rằng, kinh doanh không chỉ là bán sản phẩm, mà còn là tạo ra một môi trường làm việc để mọi người cảm thấy được tôn trọng, cùng nhau trưởng thành và phát triển bền vững.
                    </p>
                    <p>
                        Cuốn <strong>"Văn hóa Doanh nghiệp LYHU"</strong> này là nơi chúng ta ghi lại những giá trị chung để nhắc nhở và định hướng mỗi ngày. Văn hóa không phải điều xa vời, mà là cách chúng ta làm việc, ứng xử, chia sẻ và gắn bó với nhau.
                    </p>
                    
                    <div className="pt-6 mt-8 border-t border-slate-100">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wide">KẾT NỐI CHÂN THÀNH – HỢP TÁC BỀN VỮNG</h4>
                        <p className="mt-2 text-slate-500 italic">Trân trọng,</p>
                        <p className="font-semibold text-slate-800 text-xl tracking-wide mt-1" style={{ color: brand.teal }}>Ban Lãnh đạo LYHU</p>
                    </div>
                </div>

                <div className="w-full lg:w-[400px] shrink-0">
                    {/* Placeholder cho ảnh Banner thư lãnh đạo hoặc ảnh tòa nhà */}
                    <ImagePlaceholder className="aspect-[3/4]" label="Ảnh Lãnh đạo / Tòa nhà LYHU (Trang 4/43)" />
                </div>
            </div>

            <div className="pt-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">4 TRỤ CỘT HOẠT ĐỘNG</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                        <ImagePlaceholder className="w-16 h-16 rounded-full mb-4 !p-0 aspect-square" label="Icon" />
                        <span className="font-bold uppercase text-slate-700 tracking-wider">Sản xuất</span>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                        <ImagePlaceholder className="w-16 h-16 rounded-full mb-4 !p-0 aspect-square" label="Icon" />
                        <span className="font-bold uppercase text-slate-700 tracking-wider">Nhập khẩu</span>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                        <ImagePlaceholder className="w-16 h-16 rounded-full mb-4 !p-0 aspect-square" label="Icon" />
                        <span className="font-bold uppercase text-slate-700 tracking-wider">Thương mại</span>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                        <ImagePlaceholder className="w-16 h-16 rounded-full mb-4 !p-0 aspect-square" label="Icon" />
                        <span className="font-bold uppercase text-slate-700 tracking-wider">Bán lẻ</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BrandIdentityView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            {/* Slogan Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200">
                <ImagePlaceholder className="aspect-[21/9] !border-none !rounded-none opacity-40 mix-blend-overlay" label="Ảnh nền đội ngũ (Trang 18)" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white z-10">
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest mb-4">CHÚNG TA CÓ THỂ</h2>
                    <p className="text-xl md:text-2xl font-light tracking-wide text-slate-200">Vươn lên và vượt qua mọi thách thức</p>
                </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">ADN LYHU – Sức mạnh của 4 chữ cái</h1>
                    <div className="h-1 w-16 mt-4 mb-10" style={{ backgroundColor: brand.teal }}></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="group">
                        <div className="flex items-center gap-6 mb-4">
                            <div className="text-6xl font-black" style={{ color: brand.teal }}>L</div>
                            <div>
                                <h4 className="font-black text-slate-800 text-3xl tracking-widest uppercase">LOVE</h4>
                                <p className="text-slate-500 font-medium uppercase tracking-widest text-sm mt-1">Yêu thương công việc</p>
                            </div>
                        </div>
                        <ImagePlaceholder className="aspect-[3/2] mb-4" label="Ảnh Poster LOVE (Trang 13)" />
                        <p className="text-slate-600 text-lg leading-relaxed">Định hình lại các tiêu chuẩn và tạo ra những chuẩn mực mới bằng tình yêu và niềm đam mê công việc.</p>
                    </div>

                    <div className="group">
                        <div className="flex items-center gap-6 mb-4">
                            <div className="text-6xl font-black" style={{ color: brand.green }}>Y</div>
                            <div>
                                <h4 className="font-black text-slate-800 text-3xl tracking-widest uppercase">YEARN</h4>
                                <p className="text-slate-500 font-medium uppercase tracking-widest text-sm mt-1">Mong đợi thành công lớn</p>
                            </div>
                        </div>
                        <ImagePlaceholder className="aspect-[3/2] mb-4" label="Ảnh Poster YEARN (Trang 14)" />
                        <p className="text-slate-600 text-lg leading-relaxed">Luôn khao khát và nỗ lực để kiến tạo nên những giá trị vật chất và tinh thần vượt xa mong đợi.</p>
                    </div>

                    <div className="group">
                        <div className="flex items-center gap-6 mb-4">
                            <div className="text-6xl font-black" style={{ color: brand.green }}>H</div>
                            <div>
                                <h4 className="font-black text-slate-800 text-3xl tracking-widest uppercase">HARMONIZE</h4>
                                <p className="text-slate-500 font-medium uppercase tracking-widest text-sm mt-1">Hòa hợp trong tập thể</p>
                            </div>
                        </div>
                        <ImagePlaceholder className="aspect-[3/2] mb-4" label="Ảnh Poster HARMONIZE (Trang 16)" />
                        <p className="text-slate-600 text-lg leading-relaxed">Sức mạnh của tập thể luôn lớn hơn cá nhân. Sự gắn kết đồng thuận tạo nên động lực bức phá.</p>
                    </div>

                    <div className="group">
                        <div className="flex items-center gap-6 mb-4">
                            <div className="text-6xl font-black" style={{ color: brand.teal }}>U</div>
                            <div>
                                <h4 className="font-black text-slate-800 text-3xl tracking-widest uppercase">UNIFY</h4>
                                <p className="text-slate-500 font-medium uppercase tracking-widest text-sm mt-1">Thống nhất cùng mục tiêu</p>
                            </div>
                        </div>
                        <ImagePlaceholder className="aspect-[3/2] mb-4" label="Ảnh Poster UNIFY (Trang 17)" />
                        <p className="text-slate-600 text-lg leading-relaxed">Cùng chung một tầm nhìn, đồng lòng hướng tới một tương lai thịnh vượng, mang tên LYHU.</p>
                    </div>
                </div>
                
                {/* Ý Nghĩa Màu Sắc */}
                <div className="mt-16 pt-12 border-t border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 uppercase tracking-wide text-center">Ý Nghĩa Gam Màu Thương Hiệu</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 p-2">
                            <div className="w-24 shrink-0 rounded-xl flex items-center justify-center text-white text-xs font-mono font-bold shadow-sm" style={{ backgroundColor: brand.teal }}>#04ACA9</div>
                            <div className="pl-6 py-4 flex-1">
                                <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-2">Thanh Lịch & Uy Tín</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">Xanh ngọc - Biểu trưng cho sự hiện đại, chân thành, sâu sắc và độ tin cậy tuyệt đối.</p>
                            </div>
                        </div>
                        <div className="flex bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 p-2">
                            <div className="w-24 shrink-0 rounded-xl flex items-center justify-center text-white text-xs font-mono font-bold shadow-sm" style={{ backgroundColor: brand.green }}>#8FC842</div>
                            <div className="pl-6 py-4 flex-1">
                                <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-2">Tươi Mới & Vững Bền</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">Xanh lá - Mang năng lượng của sự sinh trưởng, bền vững, thân thiện và không ngừng phát triển.</p>
                            </div>
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
                    <div className="flex-1">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Giá Trị Cốt Lõi 3K1C</h1>
                        <div className="h-1 w-16 mt-4 mb-6" style={{ backgroundColor: brand.teal }}></div>
                        <p className="text-slate-600 text-xl leading-relaxed font-light">
                            <strong className="font-bold text-slate-800">3K1C</strong> không chỉ là nguyên tắc làm việc, mà còn là thái độ sống, giúp mỗi thành viên LYHU cùng nhau trưởng thành, gắn kết và kiến tạo giá trị lâu dài.
                        </p>
                    </div>
                    <div className="w-full md:w-[350px] shrink-0">
                        <ImagePlaceholder className="aspect-[3/4]" label="Ảnh Poster 3K1C Biểu tượng (Trang 20)" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { 
                        title: "KỶ LUẬT", 
                        subtitle: "KỶ LUẬT LÀ HÀNH VI",
                        desc: "Là nền móng để mọi người làm đúng nguyên tắc, quy chuẩn, và giữ sự ổn định trong hành động. Nếu thiếu kỷ luật, kiên trì và kiên nhẫn sẽ dễ bị phá vỡ.",
                        color: brand.teal
                    },
                    { 
                        title: "KIÊN TRÌ", 
                        subtitle: "KIÊN TRÌ LÀ THÓI QUEN",
                        desc: "Sau khi có kỷ luật, chúng ta mới duy trì được hành động đều đặn và không bỏ cuộc khi gặp khó khăn. Kiên trì là 'máy phát lực' giúp kỷ luật không bị nguội lạnh.",
                        color: brand.green
                    },
                    { 
                        title: "KIÊN NHẪN", 
                        subtitle: "KIÊN NHẪN LÀ THÁI ĐỘ",
                        desc: "Kiên trì là hành động liên tục, còn kiên nhẫn là thái độ chấp nhận nhịp độ và thời gian cần thiết để thấy kết quả. Giúp chúng ta tránh nóng vội và giảm áp lực tâm lý.",
                        color: brand.teal
                    },
                    { 
                        title: "CHẤP NHẬN", 
                        subtitle: "CHẤP NHẬN QUÁ TRÌNH LÀ TƯ DUY",
                        desc: "Là tư duy cao nhất: hiểu rằng mọi thành quả đều đến từ hành trình, không chỉ đích đến. Giúp chúng ta gắn bó lâu dài và sẵn sàng đối mặt với thăng trầm.",
                        color: brand.green
                    }
                ].map((item, idx) => (
                    <div key={idx} className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
                        {/* Graphic element */}
                        <div className="absolute -top-6 -right-6 text-9xl font-black opacity-5 transition-transform group-hover:scale-110" style={{ color: item.color }}>
                            {idx + 1}
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ color: item.color }}>{item.title}</h3>
                            <h4 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-6">{item.subtitle}</h4>
                            <p className="text-slate-600 leading-relaxed text-lg">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Quote Block */}
            <div className="mt-8 relative bg-white p-10 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Quote className="w-24 h-24" style={{ color: brand.teal }} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-[300px] shrink-0">
                        <ImagePlaceholder className="aspect-square !bg-slate-50" label="Đồ họa bậc thang (Trang 25)" />
                    </div>
                    <div className="flex-1">
                        <p className="italic font-serif text-slate-700 text-2xl leading-relaxed mb-6">
                            "Chọn đúng thời gian, sự bền bỉ và mười năm nỗ lực rồi cuối cùng sẽ khiến bạn có vẻ như thành công chỉ trong một đêm."
                        </p>
                        <p className="font-bold text-slate-900 tracking-wide uppercase">— BIZ STONE (Đồng sáng lập Twitter)</p>
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

                {/* Banner Icons */}
                <div className="grid grid-cols-2 gap-8 mb-16 max-w-2xl mx-auto">
                    <div className="text-center">
                        <ImagePlaceholder className="aspect-square max-w-[200px] mx-auto !rounded-full !border-0 bg-slate-50" label="Icon Chân thành" />
                        <h3 className="mt-6 text-2xl font-bold uppercase tracking-wide" style={{ color: brand.teal }}>KẾT NỐI CHÂN THÀNH</h3>
                    </div>
                    <div className="text-center">
                        <ImagePlaceholder className="aspect-square max-w-[200px] mx-auto !rounded-full !border-0 bg-slate-50" label="Icon Hợp tác" />
                        <h3 className="mt-6 text-2xl font-bold uppercase tracking-wide" style={{ color: brand.green }}>HỢP TÁC BỀN VỮNG</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4 uppercase tracking-wide">Tại LYHU,</h3>
                        <p className="text-slate-600 text-lg leading-loose">
                            Chúng tôi tin rằng mọi mối quan hệ đều bắt đầu từ sự chân thành. Từ người lao động cho đến đối tác và khách hàng, chúng tôi tạo ra một môi trường làm việc nơi mọi ý kiến đều được trân trọng, và <strong>mọi người không chỉ là đồng nghiệp mà còn là gia đình</strong> của chúng ta.
                        </p>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4 uppercase tracking-wide">Giá trị Lâu dài</h3>
                        <p className="text-slate-600 text-lg leading-loose">
                            Chúng tôi không chỉ tập trung vào kết quả ngắn hạn mà còn chú trọng sự bền vững lâu dài. Trong quá trình làm việc, chúng tôi hướng đến sự công bằng, minh bạch và tin cậy. <strong>Hợp tác là sự gắn kết để cùng phát triển.</strong>
                        </p>
                    </div>
                </div>

                <div className="mt-12 p-8 rounded-2xl text-center relative overflow-hidden" style={{ backgroundColor: brand.teal, color: 'white' }}>
                    <p className="text-xl md:text-2xl font-light leading-relaxed relative z-10 max-w-4xl mx-auto">
                        "Chúng tôi tin rằng giá trị <strong>Kết Nối Chân Thành – Hợp Tác Bền Vững</strong> không chỉ là khẩu hiệu, mà là cách chúng tôi chọn để làm việc và sống cùng nhau. Ở LYHU, mỗi sản phẩm hay mỗi bữa ăn đều gắn liền với sự sẻ chia, tin tưởng và thật lòng."
                    </p>
                </div>
            </div>

            {/* Team Quote Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200">
                <ImagePlaceholder className="aspect-[21/9] !border-none !rounded-none opacity-50 mix-blend-overlay" label="Ảnh team LYHU (Trang 44)" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white z-10">
                    <p className="text-2xl md:text-3xl font-serif italic mb-6 leading-relaxed max-w-4xl">
                        "Đoàn kết không chỉ là đứng cạnh nhau, mà là cùng nhìn về một hướng."
                    </p>
                    <p className="text-lg font-bold tracking-widest uppercase">— Antoine de Saint-Exupéry</p>
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
                    {/* Cột mốc 1 */}
                    <div className="flex flex-col lg:flex-row gap-8 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="w-full lg:w-1/2 shrink-0">
                            <ImagePlaceholder className="aspect-video" label="Ảnh Bản đồ 7 khu vực (Trang 32)" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-4" style={{ color: brand.green }}>HỆ THỐNG GT TOÀN QUỐC</h3>
                            <p className="text-slate-600 text-lg leading-relaxed mb-4">Phủ sóng độ nhận diện và hoạt động xuyên suốt đất nước.</p>
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

                    {/* Cột mốc 2 & 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col h-full">
                            <h3 className="text-xl font-bold text-slate-800 uppercase mb-4 tracking-wide" style={{ color: brand.teal }}>Chuỗi Hệ thống Siêu thị</h3>
                            <ImagePlaceholder className="aspect-video mb-4 w-full flex-1" label="Ảnh Winmart/GO/Tops (Trang 33)" />
                            <p className="text-slate-600 mt-4 leading-relaxed">Trở thành nhà cung cấp/đối tác chiến lược uy tín trong hệ thống đại siêu thị tiêu dùng toàn quốc.</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col h-full">
                            <h3 className="text-xl font-bold text-slate-800 uppercase mb-4 tracking-wide" style={{ color: brand.green }}>Cửa Hàng Tiện Lợi Báo Cáo</h3>
                            <ImagePlaceholder className="aspect-video mb-4 w-full flex-1" label="Ảnh CircleK/GS25... (Trang 34)" />
                            <p className="text-slate-600 mt-4 leading-relaxed">Đưa sản phẩm phủ rợp khắp chuỗi cửa hàng tiện lợi phục vụ trực tiếp giới trẻ và dân văn phòng.</p>
                        </div>
                    </div>

                    {/* Cột mốc Tương Lai (Logistics / Nội bộ) */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 uppercase mb-6 tracking-wide text-center" style={{ color: brand.teal }}>Năng Lực Cung Ứng & Vận Hành Toàn Diện</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ImagePlaceholder className="aspect-[3/4]" label="Ảnh Chuỗi cửa hàng riêng (Trang 35)" />
                            <ImagePlaceholder className="aspect-[3/4]" label="Ảnh Logistics/Tàu Container (Trang 39)" />
                            <ImagePlaceholder className="aspect-[3/4]" label="Ảnh Nhà máy/Hạ tầng (Trang 40)" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Final Quote Box */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200">
                <ImagePlaceholder className="aspect-[21/9] !border-none !rounded-none opacity-40 mix-blend-overlay" label="Ảnh leo núi (Trang 41)" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-16 text-center text-white z-10">
                    <p className="text-2xl md:text-4xl font-serif italic mb-8 max-w-4xl leading-relaxed">
                        "Tập hợp cùng nhau là điểm bắt đầu.<br/> Gắn bó cùng nhau là tiến triển.<br/> Làm việc cùng nhau là thành công."
                    </p>
                    <p className="text-xl font-bold uppercase tracking-widest text-slate-300">— Henry Ford</p>
                    <p className="text-sm text-slate-400 mt-2">(Nhà sáng lập công ty Ford Motor)</p>
                </div>
            </div>
            
            {/* Outro */}
            <div className="text-center pt-8 pb-12">
                <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: brand.teal }}>WELCOME TO LYHU</h2>
                <p className="mt-4 text-xl text-slate-500 font-light">Chúc bạn một ngày làm việc vui vẻ và hiệu quả!</p>
            </div>
        </div>
    );
}

