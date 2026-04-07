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
    CheckCircle2
} from "lucide-react";

export default function CulturePage() {
    const [activeTab, setActiveTab] = useState('intro');

    // MÀU THƯƠNG HIỆU LYHU TỪ TÀI LIỆU CỐT LÕI
    const BRAND = {
        teal: '#04ACA9',  // Xanh ngọc
        green: '#8FC842'  // Xanh lá
    };

    const TABS = [
        { id: 'intro', label: "Lời mở đầu & Giới thiệu", icon: Info },
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
                                    className={`group flex items-center justify-between px-4 py-3.5 rounded-lg cursor-pointer transition-all duration-200 \${
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
                                    <ArrowRight className={`w-4 h-4 transition-all \${isActive ? 'opacity-100' : 'opacity-0 -translate-x-2'}`} style={{ color: isActive ? BRAND.teal : '' }} />
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
                        style={{ borderLeft: `3px solid \${BRAND.teal}` }}
                    >
                        {TABS.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 flex flex-col h-full bg-white relative overflow-y-auto scrollbar-thin">
                    <div className="max-w-4xl mx-auto w-full p-8 md:p-14 lg:p-20">
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
   UI COMPONENTS (MINIMALIST & BRANDED)
   ========================================= */

function IntroductionView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-12">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Văn hóa Doanh nghiệp LYHU</h1>
                <div className="h-1 w-16 mt-4" style={{ backgroundColor: brand.teal }}></div>
            </div>

            <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
                <p><strong>Thân gửi toàn thể nhân sự LYHU,</strong></p>
                <p>
                    Từ những ngày đầu khởi nghiệp, chúng ta đã cùng nhau vượt qua nhiều thử thách. LYHU được xây dựng bằng sự nỗ lực, niềm tin và tinh thần gắn kết của từng thành viên.
                </p>
                <p>
                    Chúng tôi tin rằng, kinh doanh không chỉ là bán sản phẩm, mà còn là tạo ra một môi trường làm việc để mọi người cảm thấy được tôn trọng, cùng nhau trưởng thành và bền vững.
                </p>
                <p>
                    Cuốn "Văn hóa Doanh nghiệp LYHU" này là nơi chúng ta ghi lại những giá trị chung để nhắc nhở và định hướng mỗi ngày. Văn hóa không phải điều xa vời, mà là cách chúng ta làm việc, ứng xử, chia sẻ và gắn bó với nhau.
                </p>
                <p>
                    Chúng tôi hy vọng cuốn cẩm nang này sẽ giúp mỗi thành viên LYHU có thêm niềm tin, động lực và sự đồng lòng để cùng nhau đi thật xa.
                </p>

                <div className="pt-8 mt-12 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-slate-800 uppercase tracking-wide">KẾT NỐI CHÂN THÀNH – HỢP TÁC BỀN VỮNG</h4>
                        <p className="mt-2 text-slate-500 italic">Trân trọng,</p>
                        <p className="font-semibold text-slate-700">Ban Lãnh đạo LYHU</p>
                    </div>
                </div>
            </div>

            <div className="pt-12">
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        Lĩnh vực Hoạt động
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-white rounded-lg border border-slate-100 text-center font-medium text-slate-700">Sản xuất</div>
                        <div className="p-4 bg-white rounded-lg border border-slate-100 text-center font-medium text-slate-700">Nhập khẩu</div>
                        <div className="p-4 bg-white rounded-lg border border-slate-100 text-center font-medium text-slate-700">Thương mại</div>
                        <div className="p-4 bg-white rounded-lg border border-slate-100 text-center font-medium text-slate-700">Bán lẻ</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BrandIdentityView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-16">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">ADN LYHU – Sức mạnh của số 4</h1>
                <div className="h-1 w-16 mt-4" style={{ backgroundColor: brand.teal }}></div>
            </div>

            {/* Màu sắc */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Ý nghĩa Điểm Mẫu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="w-24 shrink-0 flex items-center justify-center text-white text-xs font-mono" style={{ backgroundColor: brand.teal }}>#04ACA9</div>
                        <div className="p-6 bg-white flex-1">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Xanh Ngọc</h3>
                            <p className="text-slate-600">Mang ý nghĩa chân thành, hiện đại, trẻ trung.</p>
                        </div>
                    </div>
                    <div className="flex border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="w-24 shrink-0 flex items-center justify-center text-white text-xs font-mono" style={{ backgroundColor: brand.green }}>#8FC842</div>
                        <div className="p-6 bg-white flex-1">
                            <h3 className="font-bold text-slate-800 text-lg mb-1">Xanh Lá</h3>
                            <p className="text-slate-600">Mang ý nghĩa phát triển, bền vững, tươi mới.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sức mạnh số 4 */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Mã Gen 4 Chữ Cái</h2>
                <p className="text-slate-600 mb-8 text-lg">
                    Tên công ty LYHU có 4 ký tự, mỗi chữ là một giá trị cốt lõi đại diện cho niềm tin của doanh nghiệp.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="p-6 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-4">
                        <div className="text-4xl font-black opacity-20 mt-1" style={{ color: brand.teal }}>L</div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-xl tracking-widest">LOVE</h4>
                            <p className="text-slate-600 mt-2">Yêu thương công việc.</p>
                        </div>
                    </div>
                    <div className="p-6 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-4">
                        <div className="text-4xl font-black opacity-20 mt-1" style={{ color: brand.green }}>Y</div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-xl tracking-widest">YEARN</h4>
                            <p className="text-slate-600 mt-2">Mong đợi thành công lớn.</p>
                        </div>
                    </div>
                    <div className="p-6 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-4">
                        <div className="text-4xl font-black opacity-20 mt-1" style={{ color: brand.teal }}>H</div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-xl tracking-widest">HARMONIZE</h4>
                            <p className="text-slate-600 mt-2">Hòa hợp trong tập thể.</p>
                        </div>
                    </div>
                    <div className="p-6 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-4">
                        <div className="text-4xl font-black opacity-20 mt-1" style={{ color: brand.green }}>U</div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-xl tracking-widest">UNIFY</h4>
                            <p className="text-slate-600 mt-2">Thống nhất cùng mục tiêu chung.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CoreValuesView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-12">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Giá Trị Cốt Lõi 3K1C</h1>
                <div className="h-1 w-16 mt-4" style={{ backgroundColor: brand.teal }}></div>
                <p className="mt-6 text-slate-600 text-lg leading-relaxed">
                    3K1C không chỉ là nguyên tắc làm việc, mà còn là thái độ sống, giúp mỗi thành viên LYHU cùng nhau trưởng thành, gắn kết và kiến tạo giá trị lâu dài.
                </p>
            </div>

            <div className="space-y-6">
                {[
                    { 
                        title: "KỶ LUẬT", 
                        subtitle: "Kỷ luật là hành vi",
                        desc: "Là nền móng để mọi người làm đúng nguyên tắc, quy chuẩn, và giữ sự ổn định trong hành động. Nếu thiếu kỷ luật, kiên trì và kiên nhẫn sẽ dễ bị phá vỡ."
                    },
                    { 
                        title: "KIÊN TRÌ", 
                        subtitle: "Kiên trì là thói quen",
                        desc: "Sau khi có kỷ luật, chúng ta mới duy trì được hành động đều đặn và không bỏ cuộc khi gặp khó khăn. Kiên trì là 'máy phát lực' giúp kỷ luật không bị nguội lạnh."
                    },
                    { 
                        title: "KIÊN NHẪN", 
                        subtitle: "Kiên nhẫn là thái độ",
                        desc: "Kiên trì là hành động liên tục, còn kiên nhẫn là thái độ chấp nhận nhịp độ và thời gian cần thiết để thấy kết quả. Giúp chúng ta tránh nóng vội và giảm áp lực tâm lý."
                    },
                    { 
                        title: "CHẤP NHẬN QUÁ TRÌNH", 
                        subtitle: "Chấp nhận quá trình là tư duy",
                        desc: "Là tư duy cao nhất: hiểu rằng mọi thành quả đều đến từ hành trình, không chỉ đích đến. Giúp chúng ta gắn bó lâu dài và sẵn sàng đối mặt với thăng trầm."
                    }
                ].map((item, idx) => (
                    <div key={idx} className="p-8 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row gap-6 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border-2" style={{ borderColor: brand.teal, color: brand.teal }}>
                            <span className="text-2xl font-black">{idx + 1}</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold uppercase tracking-tight text-slate-900">{item.title}</h3>
                            <p className="text-sm font-semibold tracking-wider uppercase mb-3" style={{ color: brand.green }}>{item.subtitle}</p>
                            <p className="text-slate-600 leading-relaxed text-lg">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-8 mt-12 bg-slate-50 border-l-4 rounded-r-xl italic text-slate-600 text-lg leading-relaxed" style={{ borderColor: brand.teal }}>
                "Chọn đúng thời gian, sự bền bỉ và mười năm nỗ lực rồi cuối cùng sẽ khiến bạn có vẻ như thành công chỉ trong một đêm." <br/><span className="font-semibold text-slate-800 not-italic block mt-2">— Biz Stone (Đồng sáng lập Twitter)</span>
            </div>
        </div>
    );
}

function PhilosophyView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-12">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Triết Lý Hành Động</h1>
                <div className="h-1 w-16 mt-4" style={{ backgroundColor: brand.teal }}></div>
            </div>

            <div className="text-center py-16 px-8 rounded-3xl" style={{ backgroundColor: brand.teal, color: '#ffffff' }}>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-4">GẮN KẾT</h2>
                <h3 className="text-2xl font-light opacity-90 tracking-widest">CHÂN THÀNH – BỀN VỮNG</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6" style={{ color: brand.teal }} />
                        Kết Nối Chân Thành
                    </h3>
                    <p className="text-slate-600 text-lg leading-loose">
                        Tại LYHU, chúng tôi tin rằng mọi mối quan hệ đều bắt đầu từ sự chân thành. Từ người lao động cho đến đối tác và khách hàng, chúng tôi tạo ra một môi trường làm việc nơi mọi ý kiến đều được trân trọng, và mọi người không chỉ là đồng nghiệp mà còn là gia đình của chúng ta.
                    </p>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6" style={{ color: brand.green }} />
                        Hợp Tác Bền Vững
                    </h3>
                    <p className="text-slate-600 text-lg leading-loose">
                        Chúng tôi không chỉ tập trung vào kết quả ngắn hạn mà còn chú trọng sự bền vững lâu dài. Trong quá trình làm việc với đối tác, khách hàng và đội ngũ, chúng tôi hướng đến sự công bằng, minh bạch và tin cậy. Hợp tác của LYHU không chỉ là một thỏa thuận kinh doanh, mà còn là sự gắn kết để cùng phát triển.
                    </p>
                </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed text-lg text-center mx-auto max-w-3xl">
                Chúng tôi tin rằng giá trị "Kết Nối Chân Thành – Hợp Tác Bền Vững" không chỉ là khẩu hiệu, mà là cách chúng tôi chọn để làm việc và sống cùng nhau. Ở LYHU, mỗi sản phẩm hay mỗi bữa ăn đều gắn liền với sự sẻ chia, tin tưởng và thật lòng.
            </div>
        </div>
    );
}

function VisionView({ brand }: { brand: any }) {
    return (
        <div className="animate-in fade-in duration-500 space-y-12">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Chúng ta hướng về đâu?</h1>
                <div className="h-1 w-16 mt-4" style={{ backgroundColor: brand.teal }}></div>
            </div>

            <div className="space-y-6">
                <div className="p-8 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors bg-white">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <Building2 className="w-8 h-8" style={{ color: brand.teal }} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">Chuỗi Hệ thống Siêu thị</h3>
                    </div>
                    <p className="text-slate-600 text-lg ml-16">Hướng tới mở rộng quy mô điểm bán siêu thị khang trang, đáp ứng vạn nhu cầu cho tệp khách hàng tiêu dùng lớn.</p>
                </div>

                <div className="p-8 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors bg-white">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <Award className="w-8 h-8" style={{ color: brand.green }} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">Cửa hàng tiện lợi LYHU</h3>
                    </div>
                    <p className="text-slate-600 text-lg ml-16">Phát triển chuỗi cửa hàng tiện lợi mang thương hiệu riêng, phủ sóng tận ngõ ngách, đồng hành liên tục với người dân.</p>
                </div>

                <div className="p-8 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors bg-white">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <MapPin className="w-8 h-8" style={{ color: brand.teal }} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">Hệ thống GT Toàn Quốc</h3>
                    </div>
                    
                    <div className="ml-16 mt-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="grid grid-cols-2 gap-4 text-slate-700 font-medium">
                            <div className="flex items-center gap-2">• Đồng bằng sông Hồng</div>
                            <div className="flex items-center gap-2">• Đồng bằng sông Cửu Long</div>
                            <div className="flex items-center gap-2">• Trung du & Miền núi phía Bắc</div>
                            <div className="flex items-center gap-2">• Bắc Trung Bộ</div>
                            <div className="flex items-center gap-2">• Duyên hải Nam Trung Bộ</div>
                            <div className="flex items-center gap-2">• Tây Nguyên</div>
                            <div className="flex items-center gap-2">• Đông Nam Bộ</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-12 text-center text-slate-500">
                <p className="italic font-serif text-xl border-t border-slate-100 pt-12">"Tập hợp cùng nhau là điểm bắt đầu. Gắn bó cùng nhau là tiến triển. Làm việc cùng nhau là thành công."</p>
                <p className="mt-2 text-slate-400">— Henry Ford</p>
            </div>
        </div>
    );
}
