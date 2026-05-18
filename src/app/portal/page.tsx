"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShieldCheck, Users, TrendingUp, UserPlus, Headset, Briefcase, Archive, Megaphone, Globe, FlaskConical, Truck, Calculator, ClipboardCheck, Video, MapPin, Camera } from "lucide-react";

const roles = [
    // 1. Nhóm Quản trị (Management)
    {
        title: "Admin",
        description: "Quản trị hệ thống và người dùng",
        href: "/login?role=admin",
        icon: ShieldCheck,
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        title: "Kế toán (Accountant)",
        description: "Tài chính & Lương",
        href: "/login?role=accountant",
        icon: Calculator,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
    },

    // 2. Nhóm Hậu Cần (Operations)
    {
        title: "Sale Admin (Hậu cần)",
        description: "Xử lý đơn & Báo giá",
        href: "/login?role=sale_admin",
        icon: ClipboardCheck,
        color: "text-rose-600",
        bg: "bg-rose-50",
    },
    {
        title: "Kho vận",
        description: "Quản lý tồn kho & xuất nhập",
        href: "/login?role=warehouse",
        icon: Archive,
        color: "text-amber-600",
        bg: "bg-amber-50",
    },
    {
        title: "R&D (Nghiên cứu)",
        description: "Dự án & Mẫu sản phẩm",
        href: "/login?role=rnd",
        icon: FlaskConical,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
    },
    {
        title: "Tuyển dụng",
        description: "Quản lý tuyển dụng & nhân sự",
        href: "/login?role=recruiter",
        icon: Briefcase,
        color: "text-rose-600",
        bg: "bg-rose-50",
    },

    // 3. Nhóm Tiền Tuyến (Front-line)
    {
        title: "Sales",
        description: "Quản lý khách hàng và đơn hàng",
        href: "/login?role=sales",
        icon: TrendingUp,
        color: "text-green-600",
        bg: "bg-green-50",
    },
    {
        title: "Sales GT",
        description: "Bán hàng thị trường GT",
        href: "/login?role=sales_gt",
        icon: MapPin,
        color: "text-teal-600",
        bg: "bg-teal-50",
    },
    {
        title: "Telesales",
        description: "Quản lý lead & đơn hàng telesales",
        href: "/login?role=telesales",
        icon: Headset,
        color: "text-orange-600",
        bg: "bg-orange-50",
    },
    {
        title: "Sale Live Stream",
        description: "Chốt đơn Live & Kho",
        href: "/login?role=livestream",
        icon: Video,
        color: "text-red-600",
        bg: "bg-red-50",
    },
    {
        title: "TMĐT (E-commerce)",
        description: "Đơn hàng đa kênh & Shopee",
        href: "/login?role=ecommerce",
        icon: Globe,
        color: "text-violet-600",
        bg: "bg-violet-50",
    },
    {
        title: "Marketing",
        description: "Quản lý chiến dịch & Content",
        href: "/login?role=marketing",
        icon: Megaphone,
        color: "text-fuchsia-600",
        bg: "bg-fuchsia-50",
    },
    {
        title: "Media (Ảnh/Video)",
        description: "Chụp ảnh & Quay dựng video",
        href: "/login?role=media_creator",
        icon: Camera,
        color: "text-pink-600",
        bg: "bg-pink-50",
    },
    {
        title: "CTV",
        description: "Quản lý lead và khách tiềm năng",
        href: "/login?role=ctv",
        icon: UserPlus,
        color: "text-purple-600",
        bg: "bg-purple-50",
    },

    // 4. Nhóm Logistics
    {
        title: "Shipper (Vận chuyển)",
        description: "Giao hàng & COD",
        href: "/login?role=shipper",
        icon: Truck,
        color: "text-amber-600",
        bg: "bg-amber-50",
    },

    // Customer
    {
        title: "Customer",
        description: "Đặt hàng và quản lý đơn hàng",
        href: "/login?role=customer",
        icon: Users,
        color: "text-primary-600",
        bg: "bg-primary-50",
    },
];

export default function Home() {
    const [logoError, setLogoError] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState(false);

    // Kiểm tra trạng thái mở khóa khi load trang
    useEffect(() => {
        const unlocked = localStorage.getItem('lyhu_portal_unlocked');
        if (unlocked === 'true') {
            setIsUnlocked(true);
        }
        setIsChecking(false);
    }, []);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        // Mã bảo mật mặc định (có thể thay đổi sau)
        if (passcode === "LYHU888") {
            localStorage.setItem('lyhu_portal_unlocked', 'true');
            setIsUnlocked(true);
            setError(false);
        } else {
            setError(true);
        }
    };

    if (isChecking) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center"></div>;
    }

    if (!isUnlocked) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Cổng Nội Bộ LYHU</h2>
                    <p className="text-sm text-slate-500 mb-6">Vui lòng nhập mã bảo mật để truy cập danh sách phân quyền.</p>
                    
                    <form onSubmit={handleUnlock}>
                        <input
                            type="password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="Nhập mã bảo mật..."
                            className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'} focus:outline-none focus:ring-2 mb-4 text-center tracking-widest font-mono text-lg`}
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm mb-4">Mã bảo mật không chính xác!</p>}
                        <button
                            type="submit"
                            className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700 transition-colors"
                        >
                            Xác Nhận
                        </button>
                    </form>
                    <Link href="/" className="inline-block mt-6 text-sm text-slate-500 hover:text-slate-800">
                        &larr; Quay lại trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl w-full">
                {/* Header with Brand Logo */}
                <div className="text-center mb-12 flex flex-col items-center mt-6 sm:mt-10">
                    <div className="relative h-40 sm:h-56 w-80 sm:w-[32rem] mb-6">
                        {!logoError ? (
                            <Image
                                src="/logo-full.png"
                                alt="LYHU Logo"
                                fill
                                className="object-contain"
                                onError={() => setLogoError(true)}
                                priority
                            />
                        ) : (
                            <h1 className="text-6xl sm:text-7xl font-bold text-primary-600 mb-2">LYHU</h1>
                        )}
                    </div>
                    
                    <div className="h-[1px] w-64 sm:w-[32rem] bg-gradient-to-r from-transparent via-primary-300 to-transparent mb-8"></div>
                    
                    <h2 className="text-lg sm:text-2xl text-slate-800 font-bold tracking-wide mb-3">
                        KẾT NỐI CHÂN THÀNH <span className="text-primary-500 mx-1">•</span> HỢP TÁC BỀN VỮNG
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500">
                        Giải pháp quản trị kênh phân phối GT/MT hàng đầu
                    </p>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                            <Link
                                key={role.title}
                                href={role.href}
                                className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer relative z-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <div className={`w-12 h-12 rounded-lg ${role.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 ${role.color}`} />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                    {role.title}
                                </h2>
                                <p className="text-sm text-slate-600">
                                    {role.description}
                                </p>
                            </Link>
                        );
                    })}
                </div>

                {/* Download App Section */}
                <div className="mt-12 sm:mt-16 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Tải ứng dụng LYHU
                    </h3>
                    <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                        Trải nghiệm tốt hơn trên thiết bị di động. Quản lý đơn hàng mọi lúc, mọi nơi.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors w-full sm:w-auto justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.84 1.53-2.95 1.48-.15-1.17.32-2.35 1.05-3.17z" />
                            </svg>
                            <div className="text-left">
                                <div className="text-[10px] uppercase font-medium opacity-80">Download on the</div>
                                <div className="text-sm font-bold leading-none">App Store</div>
                            </div>
                        </button>
                        <button className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors w-full sm:w-auto justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.37,4.29L17.5,7.16L14.54,11.15L6.05,2.66L20.37,10.93C20.72,11.14 20.96,11.5 20.96,11.93C20.96,12.36 20.72,12.72 20.37,12.95L20.37,4.29M17.5,16.84L20.37,19.71L20.37,11.05L17.5,16.84Z" />
                            </svg>
                            <div className="text-left">
                                <div className="text-[10px] uppercase font-medium opacity-80">Get it on</div>
                                <div className="text-sm font-bold leading-none">Google Play</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 sm:mt-12">
                    <p className="text-sm text-slate-500">
                        © 2025 LYHU. Kết nối chân thành - Hợp tác bền vững
                    </p>
                </div>
            </div>
        </main>
    );
}
