"use client";

import React, { useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { 
    BookOpen,
    Target, 
    Zap, 
    Users, 
    Gem, 
    TrendingUp, 
    Globe,
    CheckCircle2,
    Building2,
    ShieldCheck,
    Coffee,
    ArrowRight
} from "lucide-react";

export default function CulturePage() {
    const [activeTab, setActiveTab] = useState('intro');

    const TABS = [
        { id: 'intro', label: "Lời mở đầu", icon: BookOpen },
        { id: 'vision', label: "Tầm nhìn & Sứ mệnh", icon: Target },
        { id: 'core', label: "Giá trị Cốt lõi", icon: Gem },
        { id: 'environment', label: "Môi trường & Chế độ", icon: Building2 },
        { id: 'conduct', label: "Quy tắc ứng xử", icon: ShieldCheck },
    ];

    return (
        <DashboardShell title="Văn hóa doanh nghiệp">
            <div className="flex h-[calc(100vh-140px)] w-full bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
                
                {/* LEFT SIDEBAR (Slider) */}
                <div className="w-64 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col h-full z-10 hidden md:flex">
                    <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                        <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-wider text-sm">
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                            <span>Mục Lục Văn Hóa</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                        {TABS.map((tab) => {
                            const isActive = tab.id === activeTab;
                            const Icon = tab.icon;
                            return (
                                <div 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 \${
                                        isActive 
                                        ? "bg-white text-indigo-700 font-semibold border-l-4 border-indigo-600 shadow-sm" 
                                        : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 border-l-4 border-transparent"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-4 h-4 \${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-400'} transition-colors`} />
                                        <span className="text-[14px]">{tab.label}</span>
                                    </div>
                                    <ArrowRight className={`w-4 h-4 \${isActive ? 'opacity-100 text-indigo-400' : 'opacity-0 -translate-x-2'} transition-all`} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <div className="md:hidden absolute top-4 left-4 z-50">
                    <select 
                        value={activeTab} 
                        onChange={(e) => setActiveTab(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 w-[200px]"
                    >
                        {TABS.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-y-auto scrollbar-thin">
                    <div className="max-w-5xl mx-auto w-full">
                        {activeTab === 'intro' && <IntroductionView />}
                        {activeTab === 'vision' && <VisionMissionView />}
                        {activeTab === 'core' && <CoreValuesView />}
                        {activeTab === 'environment' && <EnvironmentView />}
                        {activeTab === 'conduct' && <ConductView />}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

/* =========================================
   HARDCODED PREMIUM TEMPLATE COMPONENTS
   ========================================= */

function IntroductionView() {
    return (
        <div className="p-8 md:p-12 lg:p-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40">
                {/* Hero Banner Area */}
                <div className="relative h-64 md:h-80 bg-slate-900 w-full overflow-hidden">
                    {/* Hướng dẫn thay ảnh: Đổi đường dẫn src của thẻ img này */}
                    <img 
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
                        alt="LYHU Office" 
                        className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white font-medium text-xs mb-4 backdrop-blur-md border border-white/20 uppercase tracking-widest">
                            <Gem className="w-3.5 h-3.5" />
                            Lời Mở Đầu
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Chào Mừng Đến Với LYHU</h1>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 md:p-12 lg:p-16 space-y-8 bg-white">
                    <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed font-serif italic text-indigo-900 border-l-4 border-indigo-500 pl-6">
                        "Khởi nguồn từ những khao khát kết nối, LYHU được tạo dựng không chỉ là một doanh nghiệp, mà là một cộng đồng trân trọng sự đóng góp của mọi cá nhân."
                    </p>

                    <div className="space-y-6 text-slate-600 leading-loose text-lg">
                        <p>
                            Thân gửi toàn thể nhân sự LYHU,
                        </p>
                        <p>
                            Từ những ngày đầu khởi nghiệp với muôn vàn khó khăn, chúng ta đã cùng nhau vượt qua nhiều thử thách. LYHU được xây dựng bằng sự nỗ lực, niềm tin và tinh thần gắn kết của từng thành viên. Chúng tôi tin rằng, kinh doanh không chỉ là mang sản phẩm tới khách hàng, mà cốt lõi là tạo ra một môi trường làm việc để mọi người cảm thấy được tôn trọng, cùng nhau trưởng thành và bền vững.
                        </p>
                        <p>
                            Cuốn **"Văn hóa Doanh nghiệp LYHU"** này là nơi chúng ta ghi lại những giá trị chung để nhắc nhở và định hướng mỗi ngày. Văn hóa không phải điều xa vời, mà là cách chúng ta làm việc, ứng xử, chia sẻ và gắn bó với nhau. 
                        </p>
                        <p>
                            Chúng tôi hy vọng cuốn cẩm nang này sẽ giúp mỗi thành viên LYHU có thêm niềm tin, động lực và sự đồng lòng để cùng nhau đi thật xa.
                        </p>

                        <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">KẾT NỐI CHÂN THÀNH – HỢP TÁC BỀN VỮNG</h4>
                                <p className="text-indigo-600 font-medium mt-1">Trân trọng,</p>
                                <p className="text-slate-500 italic">Ban Lãnh đạo LYHU</p>
                            </div>
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-4 ring-indigo-50">
                                {/* Thay Logo LYHU tại đây */}
                                <img src="/logo-icon.png" alt="Logo" className="w-12 h-12 object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VisionMissionView() {
    return (
        <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-16">
                <h2 className="text-sm font-bold tracking-widest text-indigo-500 uppercase mb-3">Định hướng tương lai</h2>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Tầm nhìn & Sứ mệnh</h1>
                <p className="mt-4 text-slate-500 max-w-2xl mx-auto">Kim chỉ nam định hướng cho mọi chiến lược hoạt động và thước đo sự phát triển của công ty.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Sứ Mệnh */}
                <div className="relative bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 transition-transform duration-500 group-hover:scale-150" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/30">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-6">Sứ mệnh</h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Cung cấp những giải pháp tiếp thị và bán hàng tối ưu, mang lại giá trị cao nhất cho khách hàng, đồng thời tạo ra một môi trường làm việc hạnh phúc, thu nhập cao cho đội ngũ nhân sự.
                        </p>
                    </div>
                </div>

                {/* Tầm Nhìn */}
                <div className="relative bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 transition-transform duration-500 group-hover:scale-150" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-600/30">
                            <Globe className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-6">Tầm nhìn</h3>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Trở thành hệ sinh thái nền tảng số và thương mại hàng đầu, thay đổi cách thức các doanh nghiệp kết nối, phân phối và phục vụ khách hàng trên toàn cầu.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Slogan */}
            <div className="mt-16 bg-slate-900 rounded-[2rem] p-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" />
                <h3 className="relative z-10 text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-blue-300 to-indigo-300">
                    "Tốc độ bứt phá - Bền vững vươn xa"
                </h3>
            </div>
        </div>
    );
}

function CoreValuesView() {
    const values = [
        { title: "Khách hàng là đích đến", desc: "Mọi quyết định đều lấy sự hài lòng của khách hàng làm thước đo.", color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Chủ động sáng tạo", desc: "Không gò bó trong khuôn khổ, luôn tìm kiếm giải pháp đột phá.", color: "text-indigo-600", bg: "bg-indigo-50" },
        { title: "Nói lời giữ lấy lời", desc: "Cam kết trách nhiệm tuyệt đối với công việc và lời hứa.", color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Sức mạnh tập thể", desc: "Không có ngôi sao đơn độc, chỉ có dải ngân hà lấp lánh cùng nhau.", color: "text-rose-600", bg: "bg-rose-50" },
        { title: "Hành động thần tốc", desc: "Thực thi mọi ý tưởng ngay khi nó còn nằm trên giấy.", color: "text-amber-600", bg: "bg-amber-50" },
        { title: "Học hỏi không ngừng", desc: "Liên tục nâng cấp bản thân để không bị thụt lùi lại phía sau.", color: "text-purple-600", bg: "bg-purple-50" }
    ];

    return (
        <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">6 Giá Trị Cốt Lõi</h1>
                <p className="mt-4 text-slate-500 text-lg">Mã gen nhận diện của con người LYHU.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {values.map((v, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                        <div className={`w-14 h-14 rounded-2xl \${v.bg} \${v.color} flex items-center justify-center font-black text-2xl mb-6`}>
                            {i+1}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">{v.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{v.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EnvironmentView() {
    return (
        <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Môi trường & Chế độ</h1>
            <p className="text-slate-500 text-lg mb-12">LYHU không chỉ là nơi làm việc, mà là ngôi nhà thứ hai.</p>

            <div className="flex flex-col lg:flex-row gap-12">
                {/* Images Masonry */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" alt="Team" className="rounded-3xl w-full h-64 object-cover shadow-sm hover:shadow-md transition-shadow" />
                    <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" alt="Office" className="rounded-3xl w-full h-64 object-cover shadow-sm translate-y-8 hover:shadow-md transition-shadow" />
                </div>

                {/* List Details */}
                <div className="flex-1 space-y-8 lg:py-8">
                    <div className="flex gap-4">
                        <div className="mt-1 shrink-0"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-800">Không gian mở</h4>
                            <p className="text-slate-600 mt-2">Văn phòng thiết kế hiện đại, nhiều không gian xanh, khích lệ sự trao đổi thẳng thắn và tư duy mở.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="mt-1 shrink-0"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-800">Cơ hội thăng tiến</h4>
                            <p className="text-slate-600 mt-2">Đánh giá năng lực 100% dựa trên hiệu quả thực tế công việc. Đường thăng tiến rõ ràng (Leader, Manager, Director).</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="mt-1 shrink-0"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-800">Đãi ngộ xứng đáng</h4>
                            <p className="text-slate-600 mt-2">Thưởng KPIs hàng tháng, thưởng nóng đột xuất, du lịch thường niên và các chế độ bảo hiểm tiêu chuẩn Quốc gia.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConductView() {
    return (
        <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Quy tắc ứng xử</h1>
            <p className="text-slate-500 text-lg mb-12">Chuẩn mực giao tiếp nội bộ và trong công việc tại tổ chức.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                    <h3 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" /> NÊN LÀM
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex gap-3 text-emerald-900"><span className="font-bold">•</span> Giao tiếp lịch sự, tôn trọng cấp trên và hòa nhã với đồng nghiệp.</li>
                        <li className="flex gap-3 text-emerald-900"><span className="font-bold">•</span> Chủ động đưa ra sáng kiến và nhận lỗi khi phạm sai lầm.</li>
                        <li className="flex gap-3 text-emerald-900"><span className="font-bold">•</span> Ăn mặc lịch sự, phù hợp với tác phong công sở.</li>
                        <li className="flex gap-3 text-emerald-900"><span className="font-bold">•</span> Bảo mật tuyệt đối dữ liệu khách hàng và bí mật kinh doanh.</li>
                    </ul>
                </div>

                <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100">
                    <h3 className="text-2xl font-bold text-rose-800 mb-6 flex items-center gap-2">
                        <Zap className="w-6 h-6" /> KHÔNG NÊN LÀM
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex gap-3 text-rose-900"><span className="font-bold">•</span> Chia bè phái, nói xấu đồng nghiệp gây mất đoàn kết nội bộ.</li>
                        <li className="flex gap-3 text-rose-900"><span className="font-bold">•</span> Tư lợi cá nhân, gian lận trong báo cáo doanh số, KPI.</li>
                        <li className="flex gap-3 text-rose-900"><span className="font-bold">•</span> Trễ giờ làm việc và tham gia các cuộc họp chung không lý do.</li>
                        <li className="flex gap-3 text-rose-900"><span className="font-bold">•</span> Đổ lỗi cho ngoại cảnh thay vì tìm kiếm giải pháp giải quyết điểm tắc nghẽn.</li>
                    </ul>
                </div>
            </div>
            
            <div className="mt-8 text-center text-slate-400 italic text-sm">
                * Các vi phạm quy tắc ứng xử nghiêm trọng có thể xem xét kỷ luật theo quy định công ty.
            </div>
        </div>
    );
}
