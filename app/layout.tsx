import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { LayerProvider } from "@/app/contexts/LayerContext";
import { Suspense } from 'react';
import VisitTracker from "@/app/components/VisitTracker";

export const metadata: Metadata = {
    title: "پرداخت الکترونیک عوارض شهرداری سبزوار",
    description: "پرداخت الکترونیک عوارض شهرداری سبزوار",
    icons: {
        icon: '/images/shahrdari.png',
        shortcut: '/images/shahrdari.png',
        apple: '/images/shahrdari.png',
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: true,
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fa" dir={"rtl"}>
        <head>
            <link rel="stylesheet" href="/js/maplibre-gl.min.css" />
        </head>
        <body className={`antialiased`}>
        <Script src="/js/maplibre-gl.min.js" strategy="beforeInteractive" />
        <Suspense fallback={<div>در حال بارگذاری احراز هویت...</div>}>
        <AuthProvider>
            <LayerProvider>
                <VisitTracker />
                {children}
            </LayerProvider>
        </AuthProvider>
        </Suspense>

        </body>
        </html>
    );
}