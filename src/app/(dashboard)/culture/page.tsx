"use client";

import React from "react";
import { 
    Heart, 
    Target, 
    Zap, 
    Users, 
    Gem, 
    TrendingUp, 
    Download, 
    Sparkles, 
    ChevronRight,
    ArrowRight,
    Globe,
    Search
} from "lucide-react";

export default function CulturePage() {
    const coreValues = [
        {
            title: "Khách hàng là Trọng tâm",
            description: "Mọi quyết định và hành động đều xuất phát từ lợi ích và sự hài lòng của khách hàng.",
            icon: Heart,
            color: "text-rose-500",
            bg: "bg-rose-50"
        },
        {
            title: "Đổi mới & Sáng tạo",
            description: "Không ngừng tìm kiếm giải pháp mới, phá bỏ giới hạn để dẫn đầu xu hướng thị trường.",
            icon: Sparkles,
            color: "text-amber-500",
            bg: "bg-amber-50"
        },
        {
            title: "Hành động Thần tốc",
            description: "Tốc độ là vũ khí. Ra quyết định nhanh, thực thi dứt khoát và linh hoạt thích ứng.",
            icon: Zap,
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Đoàn kết & Tôn trọng",
            description: "Xây dựng môi trường bình đẳng, tôn trọng sự khác biệt và sức mạnh của tập thể.",
            icon: Users,
            color: "text-indigo-500",
            bg: "bg-indigo-50"
        },
        {
            title: "Trách nhiệm Cao",
            description: "Chủ động nhận việc, làm đến cùng và sẵn sàng chịu trách nhiệm cho mọi kết quả.",
            icon: Target,
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        },
        {
            title: "Học hỏi Không ngừng",
            description: "Luôn trau dồi kiến thức, nâng cấp bản thân để vươn tới những đỉnh cao mới.",
            icon: TrendingUp,
            color: "text-purple-500",
            bg: "bg-purple-50"
        }
    ];

    return (
        <div className="h-[calc(100vh-64px)] w-full overflow-y-auto bg-slate-50 scrollbar-thin">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white border-b border-slate-200">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-sky-50 opacity-50" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
                
                <div className="relative max-w-5xl mx-auto px-6 py-16 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-medium text-sm mb-6 border border-indigo-100">
                        <Gem className="w-4 h-4" />
                        LYHU Culture
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight mb-6">
                        Kiến tạo giá trị, <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Dẫn đầu xu hướng
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Chìa khóa mang lại sự thành công của LYHU không chỉ là chiến lược, 
                        mà là tư duy phát triển bền vững và tinh thần nhiệt huyết của từng thành viên.
                    </p>
                </div>
            </div>

            {/* Vision & Mission */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group relative bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Target className="w-32 h-32" />
                        </div>
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 ring-4 ring-blue-50/50">
                                <Target className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">Sứ mệnh</h2>
                            <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                                Cung cấp những giải pháp tiếp thị và bán hàng tối ưu, mang lại giá trị cao nhất cho khách hàng, đồng thời tạo ra một môi trường làm việc hạnh phúc, thu nhập cao cho đội ngũ nhân sự.
                            </p>
                        </div>
                    </div>

                    <div className="group relative bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Globe className="w-32 h-32" />
                        </div>
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 ring-4 ring-indigo-50/50">
                                <Search className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">Tầm nhìn</h2>
                            <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                                Trở thành hệ sinh thái nền tảng số và thương mại hàng đầu, thay đổi cách thức các doanh nghiệp kết nối, phân phối và phục vụ khách hàng trên toàn cầu.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Values */}
            <div className="bg-white border-t border-b border-slate-200 py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">6 Giá trị cốt lõi</h2>
                        <p className="text-slate-500">Những nguyên tắc định hình con người và lối sống của LYHU</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coreValues.map((value, idx) => {
                            const Icon = value.icon;
                            return (
                                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-white hover:shadow-xl transition-all duration-300 group cursor-default">
                                    <div className={`w-12 h-12 rounded-xl \${value.bg} \${value.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">{value.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {value.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Document Download CTA */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    
                    <div className="relative z-10 flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">Tìm hiểu chi tiết Bộ quy tắc gốc</h3>
                        <p className="text-slate-400 text-sm max-w-md">
                            Khám phá toàn bộ văn bản chính thức định hướng quy chuẩn chuyên nghiệp, văn hóa giao tiếp và chính sách nội bộ.
                        </p>
                    </div>
                    
                    <div className="relative z-10 w-full md:w-auto shrink-0 flex flex-col sm:flex-row gap-3">
                        <a 
                            href="/documents/culture.pdf" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors ring-2 ring-blue-600/50 hover:ring-blue-500"
                        >
                            <Download className="w-4 h-4" />
                            Đọc File Full PDF
                        </a>
                    </div>
                </div>
            </div>
            
            {/* Footer padding */}
            <div className="h-8" />
        </div>
    );
}
