import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {AuthProvider} from "@/app/contexts/AuthContext";


export const metadata: Metadata = {
  title: "نقشه شهرداری سبزوار",
  description: "نقشه شهرداری سبزوار",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir={'rtl'}>
      <body
        className={` antialiased`}
      >
      <AuthProvider>  {/* حتماً اینجا باشه */}
          {children}
      </AuthProvider>
      </body>
    </html>
  );
}
