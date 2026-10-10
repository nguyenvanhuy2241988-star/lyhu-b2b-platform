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
        default: "LYHU - Tổng Kho Phân Phối Bánh Kẹo & Nông Sản Sấy Giá Sỉ Tận Xưởng",
        template: "%s | LYHU"
    },
    description: "Tổng kho phân phối sỉ bánh kẹo, đồ ăn vặt và nông sản sấy đặc sản LYHU. Nguồn hàng tận xưởng, pháp lý VAT đầy đủ, chiết khấu cao cho siêu thị mini, tạp hóa và đại lý toàn quốc.",
    keywords: ["LYHU", "bánh kẹo giá sỉ", "tổng kho sỉ bánh kẹo", "đồ ăn vặt giá sỉ", "nông sản sấy", "bán buôn tạp hóa", "kẹo dẻo UHi", "snack CVT"],
    openGraph: {
        title: "LYHU - Tổng Kho Phân Phối Bánh Kẹo & Nông Sản Sấy Giá Sỉ",
        description: "Nguồn hàng bánh kẹo, đồ ăn vặt và đặc sản giá sỉ tận xưởng cho siêu thị mini & tạp hóa toàn quốc.",
        url: "https://lyhu.com.vn",
        siteName: "LYHU",
        locale: "vi_VN",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "LYHU - Tổng Kho Phân Phối Bánh Kẹo & Nông Sản Sấy Giá Sỉ",
        description: "Nguồn hàng bánh kẹo, đồ ăn vặt và đặc sản giá sỉ tận xưởng.",
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
