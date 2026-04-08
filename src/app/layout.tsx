import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "LYHU App",
    description: "B2B Application for LYHU",
};

const inter = Inter({ subsets: ["latin", "vietnamese"] });

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
                        {children}
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
