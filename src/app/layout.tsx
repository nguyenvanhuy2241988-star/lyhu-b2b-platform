import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
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
    description: "LYHU - Doanh nghiệp sản xuất, nhập khẩu và phân phối thực phẩm hàng đầu. Sản phẩm chủ lực: Khoai môn tẩm vị CVT, kẹo dẻo siêu chua UHi, bánh tráng Abi Snack, bột phô mai BOYO. Kết nối chân thành - Hợp tác bền vững cùng đại lý và siêu thị toàn quốc.",
    keywords: [
        "LYHU",
        "lyhu.vn",
        "Khoai môn tẩm vị CVT",
        "kẹo dẻo siêu chua UHi",
        "bánh tráng Abi Snack",
        "Bột phô mai BOYO",
        "BOYO",
        "CVT",
        "ABI SNACK",
        "UHI",
        "kẹo dẻo UHi",
        "snack CVT",
        "nhập khẩu thực phẩm",
        "phân phối thực phẩm"
    ],
    openGraph: {
        title: "LYHU | Kết Nối Chân Thành - Hợp Tác Bền Vững",
        description: "Sản phẩm chủ lực: Khoai môn tẩm vị CVT, kẹo dẻo siêu chua UHi, bánh tráng Abi Snack, bột phô mai BOYO. Kết nối chân thành - Hợp tác bền vững.",
        url: "https://lyhu.com.vn",
        siteName: "LYHU",
        locale: "vi_VN",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "LYHU | Kết Nối Chân Thành - Hợp Tác Bền Vững",
        description: "Sản phẩm chủ lực: Khoai môn tẩm vị CVT, kẹo dẻo siêu chua UHi, bánh tráng Abi Snack, bột phô mai BOYO.",
    },
    alternates: {
        canonical: "https://lyhu.com.vn",
    },
};

const merriweather = Merriweather({
    weight: ['300', '400', '700', '900'],
    subsets: ['latin', 'vietnamese'],
    variable: '--font-merriweather',
    display: 'swap'
});

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: '--font-inter', display: 'swap' });

import WebTracker from "@/components/analytics/WebTracker";
import AffiliateTracker from "@/components/analytics/AffiliateTracker";
import CookieConsent from "@/components/common/CookieConsent";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" className={cn(inter.variable, merriweather.variable)}>
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
