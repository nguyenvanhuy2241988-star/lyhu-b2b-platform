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
                                key={role.href}
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
