import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "LYHU App",
    description: "B2B Application for LYHU",
};

const beVietnamPro = Be_Vietnam_Pro({ 
    subsets: ["latin", "vietnamese"],
    weight: ["300", "400", "500", "600", "700", "800", "900"],
    variable: "--font-be-vietnam-pro"
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body className={cn(beVietnamPro.className, "min-h-screen bg-gray-50")}>
                <AuthProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
