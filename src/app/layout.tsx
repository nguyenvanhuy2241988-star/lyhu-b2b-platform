import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "LYHU App",
    description: "B2B Application for LYHU",
};

const inter = Inter({ subsets: ["latin", "vietnamese"] });

import WebTracker from "@/components/analytics/WebTracker";
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
                        </Suspense>
                        {children}
                        <CookieConsent />
                    </ToastProvider>
                </AuthProvider>
            </body>

        </html>
    );
}
