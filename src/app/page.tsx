import Link from "next/link";
import { ShieldCheck, Users, TrendingUp, UserPlus } from "lucide-react";

const roles = [
    {
        title: "Admin",
        description: "Quản trị hệ thống và người dùng",
        href: "/login",
        icon: ShieldCheck,
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        title: "Customer",
        description: "Đặt hàng và quản lý đơn hàng",
        href: "/login",
        icon: Users,
        color: "text-primary-600",
        bg: "bg-primary-50",
    },
    {
        title: "Sales",
        description: "Quản lý khách hàng và đơn hàng",
        href: "/login",
        icon: TrendingUp,
        color: "text-green-600",
        bg: "bg-green-50",
    },
    {
        title: "CTV",
        description: "Quản lý lead và khách tiềm năng",
        href: "/login",
        icon: UserPlus,
        color: "text-purple-600",
        bg: "bg-purple-50",
    },
];

export default function Home() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl w-full">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
                        LYHU B2B Platform
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600">
                        Ứng dụng đặt hàng và quản trị kênh GT/MT cho LYHU
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
                                className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all duration-200"
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
