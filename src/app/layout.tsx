import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dormi | ระบบจัดการหอพัก",
  description: "ระบบจัดการหอพัก ห้องพัก ผู้เช่า มิเตอร์ และใบแจ้งหนี้",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50 text-gray-900">
        <Providers>
          <I18nProvider>
            {children}
            <Toaster richColors position="top-right" />
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
