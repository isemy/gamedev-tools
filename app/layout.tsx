import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameDev Tools — 游戏开发工具集合",
  description: "面向独立游戏开发者的一站式在线工具平台，免安装、浏览器直接可用。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--primary)/0.03,transparent_50%)]" />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          <p className="font-medium">GameDev Tools · 为独立游戏开发者而生</p>
        </footer>
      </body>
    </html>
  );
}
