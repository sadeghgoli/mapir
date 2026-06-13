import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


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
        {children}
      </body>
    </html>
  );
}
