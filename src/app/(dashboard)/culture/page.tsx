"use client";

import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { 
    Heart, 
    Target, 
    Zap, 
    Users, 
    Gem, 
    TrendingUp, 
    Sparkles, 
    Globe,
    Search
} from "lucide-react";

export default function CulturePage() {
    const coreValues = [
        {
            title: "Khách hàng là Trọng tâm",
            description: "Mọi quyết định và hành động đều xuất phát từ lợi ích và sự hài lòng của khách hàng. Chúng ta nỗ lực vượt trên cả sự kỳ vọng.",
            icon: Heart,
            color: "text-rose-500",
            bg: "bg-rose-50"
        },
        {
            title: "Đổi mới & Sáng tạo",
            description: "Không ngừng tìm kiếm giải pháp mới, phá bỏ giới hạn cũ để dẫn đầu xu hướng thị trường và tối ưu hóa quy trình.",
            icon: Sparkles,
            color: "text-amber-500",
            bg: "bg-amber-50"
        },
        {
            title: "Hành động Thần tốc",
            description: "Tốc độ là vũ khí. Ra quyết định nhanh, thực thi dứt khoát, linh hoạt thích ứng với sự thay đổi của công nghệ và thương trường.",
            icon: Zap,
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Đoàn kết & Tôn trọng",
            description: "Xây dựng môi trường bình đẳng, giao tiếp minh bạch, tôn trọng sự khác biệt và khai thác sức mạnh của từng cá nhân vào tập thể.",
            icon: Users,
            color: "text-indigo-500",
            bg: "bg-indigo-50"
        },
        {
            title: "Trách nhiệm Cao",
            description: "Chủ động nhận việc, làm đến cùng và sẵn sàng chịu trách nhiệm cho mọi kết quả. Không đổ lỗi, luôn tìm kiếm giải pháp.",
            icon: Target,
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        },
        {
            title: "Học hỏi Không ngừng",
            description: "Luôn trau dồi kiến thức mới nhất, nâng cấp giới hạn bản thân để cùng LYHU vươn tới những đỉnh cao mới mỗi ngày.",
            icon: TrendingUp,
            color: "text-purple-500",
            bg: "bg-purple-50"
        }
    ];

    return (
        <DashboardShell title="Văn hóa doanh nghiệp">
            <div className="w-full max-w-6xl mx-auto space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Hero Section */}
                <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-sky-50 opacity-80" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
                    
                    <div className="relative z-10 px-6 py-20 md:py-24 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-sm mb-6 border border-indigo-100 shadow-sm">
                            <Gem className="w-4 h-4" />
                            Văn Hóa Doanh Nghiệp LYHU
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight mb-6">
                            Kiến tạo giá trị, <br className="hidden md:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Dẫn đầu xu hướng
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                            Chìa khóa mang lại sự thành công của LYHU không chỉ là chiến lược nhạy bén, 
                            mà cốt lõi là tư duy phát triển bền vững và tinh thần nhiệt huyết của từng thành viên.
                        </p>
                    </div>
                </div>

                {/* Vision & Mission */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group relative bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                        <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <Target className="w-64 h-64 text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center mb-6 ring-4 ring-blue-50 border border-blue-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Target className="w-7 h-7" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-4">Sứ mệnh</h2>
                            <p className="text-slate-600 text-lg leading-relaxed group-hover:text-slate-800 transition-colors">
                                Cung cấp những giải pháp tiếp thị và bán hàng tối ưu nhất, mang lại luồng giá trị khổng lồ cho khách hàng. Đồng thời kiến tạo ra một môi trường làm việc hạnh phúc, thu nhập cao và cơ hội thăng tiến không giới hạn cho đội ngũ nhân sự.
                            </p>
                        </div>
                    </div>

                    <div className="group relative bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                        <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] -rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <Globe className="w-64 h-64 text-indigo-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center mb-6 ring-4 ring-indigo-50 border border-indigo-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Search className="w-7 h-7" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-4">Tầm nhìn</h2>
                            <p className="text-slate-600 text-lg leading-relaxed group-hover:text-slate-800 transition-colors">
                                Trở thành hệ sinh thái nền tảng số và thương mại hàng đầu tại khu vực, thay đổi cách thức các doanh nghiệp kết nối, phân phối sản phẩm và phục vụ khách hàng trên toàn cầu bằng công nghệ tiên tiến nhất.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Core Values */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12">
                    <div className="text-center mb-14">
                        <h2 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">6 Giá trị cốt lõi</h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mb-6" />
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Những nguyên tắc định hình lối sống, phương pháp làm việc và cách đánh giá năng lực con người tại LYHU.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {coreValues.map((value, idx) => {
                            const Icon = value.icon;
                            return (
                                <div key={idx} className="group flex flex-col bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-xl transition-all duration-300 cursor-default">
                                    <div className={`w-14 h-14 rounded-2xl \${value.bg} \${value.color} flex items-center justify-center mb-6 ring-4 ring-slate-50 border border-slate-100 group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-3">{value.title}</h3>
                                    <p className="text-base text-slate-600 leading-relaxed">
                                        {value.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Workplace Section */}
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-indigo-500/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 blur-3xl rounded-full -translate-x-1/3 translate-y-1/3" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-3xl font-bold text-white mb-4">Tinh thần đồng đội vô song</h3>
                            <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-xl">
                                Ở LYHU, không có khái niệm "làm việc đơn độc". Chúng tôi chia sẻ mục tiêu, san sẻ áp lực và cùng nhau đứng trên đỉnh vinh quang. Mỗi cá nhân là một mảnh ghép không thể thiếu của bức tranh tương lai.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <span className="px-4 py-2 bg-white/10 text-white rounded-full font-medium border border-white/20 backdrop-blur-sm">Trao quyền năng</span>
                                <span className="px-4 py-2 bg-white/10 text-white rounded-full font-medium border border-white/20 backdrop-blur-sm">Kỷ luật tự giác</span>
                                <span className="px-4 py-2 bg-white/10 text-white rounded-full font-medium border border-white/20 backdrop-blur-sm">Chung mục tiêu</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardShell>
    );
}
