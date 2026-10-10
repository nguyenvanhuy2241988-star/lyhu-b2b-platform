import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Suspense } from "react";

export const metadata: Metadata = {
    metadataBase: new URL('https://lyhu.com.vn'),
    title: {
        default: "LYHU | Kết Nối Chân Thành - Hợp Tác Bền Vững",
        template: "%s | LYHU"
    },
    description: "LYHU - Doanh nghiệp sản xuất, nhập khẩu và phân phối thực phẩm hàng đầu: Thương hiệu riêng BOYO, nhập khẩu độc quyền CVT & UHI, độc quyền miền Bắc ABI SNACK. Kết nối chân thành - Hợp tác bền vững cùng đại lý toàn quốc.",
    keywords: ["LYHU", "lyhu.vn", "BOYO", "CVT", "ABI SNACK", "UHI", "kẹo dẻo UHi", "snack CVT", "nhập khẩu thực phẩm", "phân phối thực phẩm"],
    openGraph: {
        title: "LYHU | Kết Nối Chân Thành - Hợp Tác Bền Vững",
        description: "Doanh nghiệp sản xuất, nhập khẩu và phân phối thực phẩm hàng đầu: BOYO, CVT, ABI SNACK, UHI. Kết nối chân thành - Hợp tác bền vững.",
        url: "https://lyhu.com.vn",
        siteName: "LYHU",
        locale: "vi_VN",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "LYHU | Kết Nối Chân Thành - Hợp Tác Bền Vững",
        description: "Sản xuất, nhập khẩu và phân phối thực phẩm: BOYO, CVT, ABI SNACK, UHI.",
    },
    alternates: {
        canonical: "https://lyhu.com.vn",
    },
};

const inter = Inter({ subsets: ["latin", "vietnamese"] });

import WebTracker from "@/components/analytics/WebTracker";
import AffiliateTracker from "@/components/analytics/AffiliateTracker";
import CookieConsent from "@/components/common/CookieConsent";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn(inter.className, "min-h-screen bg-gray-50")}>
                <AuthProvider>
                    <ToastProvider>
                        <Suspense fallback={null}>
                            <WebTracker />
                            <AffiliateTracker />
                        </Suspense>
                        {children}
                        <CookieConsent />
                    </ToastProvider>
                </AuthProvider>
            </body>

        </html>
    );
}
